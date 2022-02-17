import {
  FilledSignaturePayload1155,
  MintRequest1155,
  PayloadToSign1155,
  PayloadWithUri1155,
  Signature1155PayloadInput,
  Signature1155PayloadOutput,
  SignedPayload1155,
} from "../../schema/contracts/common/signature";
import { TransactionResultWithId } from "../types";
import { setErc20Allowance } from "../../common/currency";
import { BigNumber } from "ethers";
import { MintWithSignatureEvent } from "@thirdweb-dev/contracts/dist/TokenERC721";
import invariant from "tiny-invariant";
import { ContractWrapper } from "./contract-wrapper";
import { ITokenERC1155, TokenERC1155 } from "@thirdweb-dev/contracts";
import { IStorage } from "../interfaces";
import { ContractRoles } from "./contract-roles";
import { NFTCollection } from "../../contracts";

export class Erc11155SignatureMinting {
  private contractWrapper: ContractWrapper<TokenERC1155>;
  private storage: IStorage;
  private roles: ContractRoles<
    TokenERC1155,
    typeof NFTCollection.contractRoles[number]
  >;

  constructor(
    contractWrapper: ContractWrapper<TokenERC1155>,
    roles: ContractRoles<
      TokenERC1155,
      typeof NFTCollection.contractRoles[number]
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
   * // see how to craft a payload to sign in the `generateSignature()` documentation
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
    signedPayload: SignedPayload1155,
  ): Promise<TransactionResultWithId> {
    const mintRequest = signedPayload.payload;
    const signature = signedPayload.signature;
    const message = this.mapPayloadToContractStruct(mintRequest);
    const overrides = await this.contractWrapper.getCallOverrides();
    await setErc20Allowance(
      this.contractWrapper,
      BigNumber.from(message.pricePerToken),
      mintRequest.currencyAddress,
      overrides,
    );
    const receipt = await this.contractWrapper.sendTransaction(
      "mintWithSignature",
      [message, signature],
      overrides,
    );
    const t = this.contractWrapper.parseLogs<MintWithSignatureEvent>(
      "MintWithSignature",
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
   * Verify that a payload is correctly signed
   * @param signedPayload - the payload to verify
   */
  public async verify(signedPayload: SignedPayload1155): Promise<boolean> {
    const mintRequest = signedPayload.payload;
    const signature = signedPayload.signature;
    const message = this.mapPayloadToContractStruct(mintRequest);
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
   * const endTime = new Date(Date.now() + 24_HOURS);
   * const payload = {
   *   metadata: nftMetadata, // The NFT to mint
   *   to: {{wallet_address}}, // Who will receive the NFT (or AddressZero for anyone)
   *   quantity: 2, // the quantity of NFTs to mint
   *   price: 0.5, // the price per NFT
   *   currencyAddress: NATIVE_TOKEN_ADDRESS, // the currency to pay with
   *   mintStartTime: now, // can mint anytime from now
   *   mintEndTime: endTime, // to 24h from now
   * };
   *
   * const signedPayload = contract.signature.generate(payload);
   * // now anyone can use these to mint the NFT using `mintWithSignature()`
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

    const { metadataUris: uris } = await this.storage.uploadMetadataBatch(
      parsedRequests.map((r) => r.metadata),
    );

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
          this.mapPayloadToContractStruct(finalPayload),
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
  private mapPayloadToContractStruct(
    mintRequest: PayloadWithUri1155,
  ): ITokenERC1155.MintRequestStructOutput {
    return {
      to: mintRequest.to,
      royaltyRecipient: mintRequest.royaltyRecipient,
      primarySaleRecipient: mintRequest.primarySaleRecipient,
      tokenId: mintRequest.tokenId,
      uri: mintRequest.uri,
      quantity: mintRequest.quantity,
      pricePerToken: mintRequest.price,
      currency: mintRequest.currencyAddress,
      validityStartTimestamp: mintRequest.mintStartTime,
      validityEndTimestamp: mintRequest.mintEndTime,
      uid: mintRequest.uid,
    } as ITokenERC1155.MintRequestStructOutput;
  }
}
