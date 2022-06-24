import {
  FilledSignature721WithQuantity,
  FilledSignaturePayload721,
  MintRequest721,
  MintRequest721withQuantity,
  PayloadToSign721,
  PayloadToSign721withQuantity,
  PayloadWithUri721withQuantity,
  Signature721PayloadInput,
  Signature721WithQuantityInput,
  Signature721WithQuantityOutput,
  SignedPayload721,
  SignedPayload721WithQuantitySignature,
} from "../../schema/contracts/common/signature";
import { TransactionResultWithId } from "../types";
import { normalizePriceValue, setErc20Allowance } from "../../common/currency";
import { BigNumber } from "ethers";
import invariant from "tiny-invariant";
import { ContractWrapper } from "./contract-wrapper";
import {
  ISignatureMintERC721,
  ITokenERC721,
  SignatureDrop as SignatureDropContract,
  TokenERC721,
} from "contracts";
import { IStorage } from "../interfaces";
import { ContractRoles } from "./contract-roles";
import { NFTCollection } from "../../contracts";
import { uploadOrExtractURIs } from "../../common/nft";
import { TokensMintedWithSignatureEvent } from "contracts/ITokenERC721";
import { FEATURE_NFT_SIGNATURE_MINTABLE } from "../../constants/erc721-features";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { ethers } from "hardhat";

/**
 * Enables generating dynamic ERC721 NFTs with rules and an associated signature, which can then be minted by anyone securely
 * @public
 */
export class Erc721WithQuantitySignatureMintable implements DetectableFeature {
  featureName = FEATURE_NFT_SIGNATURE_MINTABLE.name;

  private contractWrapper: ContractWrapper<SignatureDropContract | TokenERC721>;
  private storage: IStorage;
  private roles?: ContractRoles<
    TokenERC721,
    typeof NFTCollection.contractRoles[number]
  >;

  constructor(
    contractWrapper: ContractWrapper<SignatureDropContract | TokenERC721>,
    storage: IStorage,
    roles?: ContractRoles<
      TokenERC721,
      typeof NFTCollection.contractRoles[number]
    >,
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
    const contractStruct = await this.mapPayloadToContractStruct(mintRequest);
    const overrides = await this.contractWrapper.getCallOverrides();

    const contractType = ethers.utils.toUtf8String(
      await this.contractWrapper.readContract.contractType(),
    );

    const isSignatureDrop = this.isSignatureDrop(
      this.contractWrapper.readContract,
      contractType,
    );

    let message;

    if (isSignatureDrop) {
      message = contractStruct as ISignatureMintERC721.MintRequestStructOutput;
      await setErc20Allowance(
        this.contractWrapper,
        message.pricePerToken,
        mintRequest.currencyAddress,
        overrides,
      );
    } else {
      message = contractStruct as ITokenERC721.MintRequestStructOutput;
      await setErc20Allowance(
        this.contractWrapper,
        message.price,
        mintRequest.currencyAddress,
        overrides,
      );
    }

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
    const contractType = ethers.utils.toUtf8String(
      await this.contractWrapper.readContract.contractType(),
    );

    const isSignatureDrop = this.isSignatureDrop(
      this.contractWrapper.readContract,
      contractType,
    );

    const contractPayloads = await Promise.all(
      signedPayloads.map(async (s) => {
        const contractStruct = await this.mapPayloadToContractStruct(s.payload);
        const signature = s.signature;
        const price = s.payload.pricePerToken;
        if (BigNumber.from(price).gt(0)) {
          throw new Error(
            "Can only batch free mints. For mints with a price, use regular mint()",
          );
        }

        let message;

        if (isSignatureDrop) {
          message =
            contractStruct as ISignatureMintERC721.MintRequestStructOutput;
          return {
            message,
            signature,
          };
        } else {
          message = contractStruct as ITokenERC721.MintRequestStructOutput;
          return {
            message,
            signature,
          };
        }
      }),
    );

    const encoded = contractPayloads.map((p) => {
      if (isSignatureDrop) {
        const contract = this.contractWrapper
          .readContract as SignatureDropContract;
        return contract.interface.encodeFunctionData("mintWithSignature", [
          p.message as ISignatureMintERC721.MintRequestStructOutput,
          p.signature,
        ]);
      } else {
        const contract = this.contractWrapper.readContract as TokenERC721;
        return contract.interface.encodeFunctionData("mintWithSignature", [
          p.message as ITokenERC721.MintRequestStructOutput,
          p.signature,
        ]);
      }
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
  public async verify(
    signedPayload: SignedPayload721WithQuantitySignature,
  ): Promise<boolean> {
    const mintRequest = signedPayload.payload;
    const signature = signedPayload.signature;
    const contractStruct = await this.mapPayloadToContractStruct(mintRequest);
    const contractType = ethers.utils.toUtf8String(
      await this.contractWrapper.readContract.contractType(),
    );

    const isSignatureDrop = this.isSignatureDrop(
      this.contractWrapper.readContract,
      contractType,
    );

    let message;
    let verification: [boolean, string];
    if (isSignatureDrop) {
      message = contractStruct as ISignatureMintERC721.MintRequestStruct;
      const contract = this.contractWrapper
        .readContract as SignatureDropContract;
      verification = await contract.verify(message, signature);
    } else {
      message = contractStruct as ITokenERC721.MintRequestStruct;
      const contract = this.contractWrapper.readContract as TokenERC721;
      verification = await contract.verify(message, signature);
    }

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
   *   price: 0.5, // the price to pay for minting
   *   currencyAddress: NATIVE_TOKEN_ADDRESS, // the currency to pay with
   *   mintStartTime: startTime, // can mint anytime from now
   *   mintEndTime: endTime, // to 24h from now,
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
    mintRequest: PayloadToSign721withQuantity | PayloadToSign721,
  ): Promise<SignedPayload721WithQuantitySignature | SignedPayload721> {
    const contractType = ethers.utils.toUtf8String(
      await this.contractWrapper.readContract.contractType(),
    );

    const isSignatureDrop = this.isSignatureDrop(
      this.contractWrapper.readContract,
      contractType,
    );

    if (isSignatureDrop) {
      const mintRequestPayload = mintRequest as PayloadToSign721withQuantity;
      return (await this.generateBatch([mintRequestPayload]))[0];
    } else {
      const mintRequestPayload = mintRequest as PayloadToSign721;
      return (await this.generateBatchToken([mintRequestPayload]))[0];
    }
  }

  /**
   * Generate a batch of signatures that can be used to mint many dynamic NFTs.
   *
   * @remarks See {@link Erc721SignatureMinting.generate}
   *
   * @param payloadsToSign - the payloads to sign
   * @returns an array of payloads and signatures
   */
  public async generateBatch(
    payloadsToSign: PayloadToSign721withQuantity[],
  ): Promise<SignedPayload721WithQuantitySignature[]> {
    await this.roles?.verify(
      ["minter"],
      await this.contractWrapper.getSignerAddress(),
    );
    const parsedRequests: FilledSignature721WithQuantity[] = payloadsToSign.map(
      (m) => Signature721WithQuantityInput.parse(m),
    );

    const metadatas = parsedRequests.map((r) => r.metadata);
    const uris = await uploadOrExtractURIs(metadatas, this.storage);

    const chainId = await this.contractWrapper.getChainID();
    const signer = this.contractWrapper.getSigner();
    invariant(signer, "No signer available");

    return await Promise.all(
      parsedRequests.map(async (m, i) => {
        const uri = uris[i];
        const finalPayload = Signature721WithQuantityOutput.parse({
          ...m,
          uri,
        });
        const signature = await this.contractWrapper.signTypedData(
          signer,
          {
            name: "SignatureMintERC721",
            version: "1",
            chainId,
            verifyingContract: await this.contractWrapper.readContract.address,
          },
          { MintRequest: MintRequest721withQuantity }, // TYPEHASH
          await this.mapPayloadToContractStruct(finalPayload),
        );
        return {
          payload: finalPayload,
          signature: signature.toString(),
        };
      }),
    );
  }

  public async generateBatchToken(
    payloadsToSign: PayloadToSign721[],
  ): Promise<SignedPayload721[]> {
    await this.roles?.verify(
      ["minter"],
      await this.contractWrapper.getSignerAddress(),
    );

    const parsedRequests: FilledSignaturePayload721[] = payloadsToSign.map(
      (m) => Signature721PayloadInput.parse(m),
    );

    const metadatas = parsedRequests.map((r) => r.metadata);
    const uris = await uploadOrExtractURIs(metadatas, this.storage);

    const chainId = await this.contractWrapper.getChainID();
    const signer = this.contractWrapper.getSigner();
    invariant(signer, "No signer available");

    return await Promise.all(
      parsedRequests.map(async (m, i) => {
        const uri = uris[i];
        const finalPayload = Signature721WithQuantityOutput.parse({
          ...m,
          uri,
        });
        const signature = await this.contractWrapper.signTypedData(
          signer,
          {
            name: "TokenERC721",
            version: "1",
            chainId,
            verifyingContract: this.contractWrapper.readContract.address,
          },
          { MintRequest: MintRequest721 },
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
  ) {
    const normalizedPricePerToken = await normalizePriceValue(
      this.contractWrapper.getProvider(),
      mintRequest.pricePerToken,
      mintRequest.currencyAddress,
    );

    const contractType = ethers.utils.toUtf8String(
      await this.contractWrapper.readContract.contractType(),
    );

    const isSignatureDrop = this.isSignatureDrop(
      this.contractWrapper.readContract,
      contractType,
    );

    if (isSignatureDrop) {
      return {
        to: mintRequest.to,
        royaltyRecipient: mintRequest.royaltyRecipient,
        royaltyBps: mintRequest.royaltyBps,
        primarySaleRecipient: mintRequest.primarySaleRecipient,
        uri: mintRequest.uri,
        quantity: mintRequest.quantity,
        pricePerToken: normalizedPricePerToken,
        currency: mintRequest.currencyAddress,
        validityEndTimestamp: mintRequest.mintEndTime,
        validityStartTimestamp: mintRequest.mintStartTime,
        uid: mintRequest.uid,
      } as ISignatureMintERC721.MintRequestStructOutput;
    } else {
      return {
        to: mintRequest.to,
        price: normalizedPricePerToken,
        uri: mintRequest.uri,
        currency: mintRequest.currencyAddress,
        validityEndTimestamp: mintRequest.mintEndTime,
        validityStartTimestamp: mintRequest.mintStartTime,
        uid: mintRequest.uid,
        royaltyRecipient: mintRequest.royaltyRecipient,
        royaltyBps: mintRequest.royaltyBps,
        primarySaleRecipient: mintRequest.primarySaleRecipient,
      } as ITokenERC721.MintRequestStructOutput;
    }
  }

  private isSignatureDrop(
    _contract: SignatureDropContract | TokenERC721,
    contractType: string,
  ): _contract is SignatureDropContract {
    return contractType.includes("SignatureDrop");
  }
}
