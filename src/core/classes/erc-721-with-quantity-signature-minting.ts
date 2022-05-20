import {
  FilledSignaturePayload1155,
  MintRequest1155,
  PayloadToSign1155,
  PayloadWithUri721withQuantity,
  Signature1155PayloadInput,
  Signature1155PayloadOutput,
  SignedPayload1155, SignedPayload721WithQuantitySignature,
} from "../../schema/contracts/common/signature";
import { TransactionResultWithId } from "../types";
import { normalizePriceValue, setErc20Allowance } from "../../common/currency";
import invariant from "tiny-invariant";
import { ContractWrapper } from "./contract-wrapper";
import {ISignatureMintERC721, TokenERC721} from "contracts";
import { IStorage } from "../interfaces";
import { ContractRoles } from "./contract-roles";
import { SignatureDrop } from "../../contracts";
import { BigNumber } from "ethers";
import { uploadOrExtractURIs } from "../../common/nft";
import { TokensMintedWithSignatureEvent } from "contracts/ITokenERC1155";

/**
 * Enables generating dynamic ERC1155 NFTs with rules and an associated signature, which can then be minted by anyone securely
 * @public
 */
export class Erc721WithQuantitySignatureMinting {
  private contractWrapper: ContractWrapper<ISignatureMintERC721>;
  private storage: IStorage;
  private roles: ContractRoles<
      TokenERC721,
    typeof SignatureDrop.contractRoles[number]
  >;

  constructor(
    contractWrapper: ContractWrapper<ISignatureMintERC721>,
    roles: ContractRoles<
        TokenERC721,
      typeof SignatureDrop.contractRoles[number]
    >,
    storage: IStorage,
  ) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
    this.roles = roles;
  }

  /**
   * Mint a dynamically generated NFT
   *
   * @remarks Mint a dynamic NFT with a previously generated signature.
   *
   * @example
   * ```javascript
   * // see how to craft a payload to sign in the `generate()` documentation
   * const signedPayload = contract.signature.generate(payload);
   *
   * // now anyone can mint the NFT
   * const tx = contract.signature.mint(signedPayload);
   * const receipt = tx.receipt; // the mint transaction receipt
   * const mintedId = tx.id; // the id of the NFT minted
   * ```
   * @param signedPayload - the previously generated payload and signature with {@link Erc721SignatureMinting.generate}
   */
  public async mint(
    signedPayload: SignedPayload721WithQuantitySignature,
  ): Promise<TransactionResultWithId> {
    const mintRequest = signedPayload.payload;
    const signature = signedPayload.signature;
    const message = await this.mapPayloadToContractStruct(mintRequest);
    const overrides = await this.contractWrapper.getCallOverrides();
    await setErc20Allowance(
      this.contractWrapper,
      message.pricePerToken.mul(message.quantity),
      mintRequest.currencyAddress,
      overrides,
    );
    const receipt = await this.contractWrapper.sendTransaction(
      "mintWithSignature",
      [message, signature],
      overrides,
    );
    const t = this.contractWrapper.parseLogs<TokensMintedWithSignatureEvent>(
      "TokensMintedWithSignature",
      receipt.logs,
    );
    if (t.length === 0) {
      throw new Error("No MintWithSignature event found");
    }
    const id = t[0].args.tokenIdMinted;
    return {
      id,
      receipt,
    };
  }

  /**
   * Mint any number of dynamically generated NFT at once
   * @remarks Mint multiple dynamic NFTs in one transaction. Note that this is only possible for free mints (cannot batch mints with a price attached to it for security reasons)
   * @param signedPayloads - the array of signed payloads to mint
   */
  public async mintBatch(
    signedPayloads: SignedPayload721WithQuantitySignature[],
  ): Promise<TransactionResultWithId[]> {
    const contractPayloads = await Promise.all(
      signedPayloads.map(async (s) => {
        const message = await this.mapPayloadToContractStruct(s.payload);
        const signature = s.signature;
        const price = s.payload.price;
        if (BigNumber.from(price).gt(0)) {
          throw new Error(
            "Can only batch free mints. For mints with a price, use regular mint()",
          );
        }
        return {
          message,
          signature,
        };
      }),
    );
    const encoded = contractPayloads.map((p) => {
      return this.contractWrapper.readContract.interface.encodeFunctionData(
        "mintWithSignature",
        [p.message, p.signature],
      );
    });
    const receipt = await this.contractWrapper.multiCall(encoded);
    const events =
      this.contractWrapper.parseLogs<TokensMintedWithSignatureEvent>(
        "TokensMintedWithSignature",
        receipt.logs,
      );
    if (events.length === 0) {
      throw new Error("No MintWithSignature event found");
    }
    return events.map((log) => ({
      id: log.args.tokenIdMinted,
      receipt,
    }));
  }

  /**
   * Verify that a payload is correctly signed
   * @param signedPayload - the payload to verify
   */
  public async verify(signedPayload: SignedPayload721WithQuantitySignature): Promise<boolean> {
    const mintRequest = signedPayload.payload;
    const signature = signedPayload.signature;
    const message = await this.mapPayloadToContractStruct(mintRequest);
    const verification: [boolean, string] =
      await this.contractWrapper.readContract.verify(message, signature);
    return verification[0];
  }

  /**
   * Generate a signature that can be used to mint a dynamic NFT
   *
   * @remarks Takes in an NFT and some information about how it can be minted, uploads the metadata and signs it with your private key. The generated signature can then be used to mint an NFT using the exact payload and signature generated.
   *
   * @example
   * ```javascript
   * const nftMetadata = {
   *   name: "Cool NFT #1",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * };
   *
   * const startTime = new Date();
   * const endTime = new Date(Date.now() + 60 * 60 * 24 * 1000);
   * const payload = {
   *   metadata: nftMetadata, // The NFT to mint
   *   to: {{wallet_address}}, // Who will receive the NFT (or AddressZero for anyone)
   *   quantity: 2, // the quantity of NFTs to mint
   *   price: 0.5, // the price per NFT
   *   currencyAddress: NATIVE_TOKEN_ADDRESS, // the currency to pay with
   *   mintStartTime: startTime, // can mint anytime from now
   *   mintEndTime: endTime, // to 24h from now
   *   royaltyRecipient: "0x...", // custom royalty recipient for this NFT
   *   royaltyBps: 100, // custom royalty fees for this NFT (in bps)
   *   primarySaleRecipient: "0x...", // custom sale recipient for this NFT
   * };
   *
   * const signedPayload = contract.signature.generate(payload);
   * // now anyone can use these to mint the NFT using `contract.signature.mint(signedPayload)`
   * ```
   * @param mintRequest - the payload to sign
   * @returns the signed payload and the corresponding signature
   */
  public async generate(
    mintRequest: PayloadToSign1155,
  ): Promise<SignedPayload1155> {
    return (await this.generateBatch([mintRequest]))[0];
  }

  /**
   * Genrate a batch of signatures that can be used to mint many dynamic NFTs.
   *
   * @remarks See {@link Erc721SignatureMinting.generate}
   *
   * @param payloadsToSign - the payloads to sign
   * @returns an array of payloads and signatures
   */
  public async generateBatch(
    payloadsToSign: PayloadToSign1155[],
  ): Promise<SignedPayload1155[]> {
    await this.roles.verify(
      ["minter"],
      await this.contractWrapper.getSignerAddress(),
    );

    const parsedRequests: FilledSignaturePayload1155[] = payloadsToSign.map(
      (m) => Signature1155PayloadInput.parse(m),
    );

    const metadatas = parsedRequests.map((r) => r.metadata);
    const uris = await uploadOrExtractURIs(metadatas, this.storage);

    const chainId = await this.contractWrapper.getChainID();
    const signer = this.contractWrapper.getSigner();
    invariant(signer, "No signer available");

    return await Promise.all(
      parsedRequests.map(async (m, i) => {
        const uri = uris[i];
        const finalPayload = Signature1155PayloadOutput.parse({
          ...m,
          uri,
        });
        const signature = await this.contractWrapper.signTypedData(
          signer,
          {
            name: "TokenERC1155",
            version: "1",
            chainId,
            verifyingContract: this.contractWrapper.readContract.address,
          },
          { MintRequest: MintRequest1155 }, // TYPEHASH
          await this.mapPayloadToContractStruct(finalPayload),
        );
        return {
          payload: finalPayload,
          signature: signature.toString(),
        };
      }),
    );
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  /**
   * Maps a payload to the format expected by the contract
   *
   * @internal
   *
   * @param mintRequest - The payload to map.
   * @returns - The mapped payload.
   */
  private async mapPayloadToContractStruct(
    mintRequest: PayloadWithUri721withQuantity,
  ): Promise<ISignatureMintERC721.MintRequestStructOutput> {
    const normalizedPricePerToken = await normalizePriceValue(
      this.contractWrapper.getProvider(),
      mintRequest.price,
      mintRequest.currencyAddress,
    );
    return {
      to: mintRequest.to,
      uri: mintRequest.uri,
      quantity: mintRequest.quantity,
      pricePerToken: normalizedPricePerToken,
      currency: mintRequest.currencyAddress,
      validityStartTimestamp: mintRequest.mintStartTime,
      validityEndTimestamp: mintRequest.mintEndTime,
      uid: mintRequest.uid,
      royaltyRecipient: mintRequest.royaltyRecipient,
      royaltyBps: mintRequest.royaltyBps,
      primarySaleRecipient: mintRequest.primarySaleRecipient,
    } as ISignatureMintERC721.MintRequestStructOutput;
  }
}
