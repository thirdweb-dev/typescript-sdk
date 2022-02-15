import { BigNumber } from "ethers";
import {
  FilledSignaturePayload,
  MintRequest,
  PayloadToSign,
  PayloadWithUri,
  SignaturePayloadInput,
  SignaturePayloadOutput,
  SignedPayload,
} from "../schema/contracts/common/signature";
import {
  CommonNFTInput,
  NFTMetadataInput,
  NFTMetadataOwner,
} from "../schema/tokens/common";
import type {
  IStorage,
  NetworkOrSignerOrProvider,
  TransactionResultWithId,
} from "../core";
import { TokenErc721ContractSchema } from "../schema/contracts/token-erc721";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  ITokenERC721,
  TokenERC721,
  TokenERC721__factory,
} from "@3rdweb/contracts";
import { SDKOptions } from "../schema/sdk-options";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { Erc721 } from "../core/classes/erc-721";
import { ContractPrimarySale } from "../core/classes/contract-sales";
import {
  MintWithSignatureEvent,
  TokenMintedEvent,
} from "@3rdweb/contracts/dist/TokenERC721";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { ContractEncoder } from "../core/classes/contract-encoder";
import { setErc20Allowance } from "../common/currency";
import invariant from "tiny-invariant";

/**
 * Create a collection of one-of-one NFTs.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@3rdweb/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const nftCollection = sdk.getNFTCollection("{{contract_address}}");
 * ```
 *
 * @public
 */
export class NFTCollection extends Erc721<TokenERC721> {
  static contractType = "nft-collection" as const;
  static contractRoles = ["admin", "minter", "transfer"] as const;
  static contractFactory = TokenERC721__factory;
  /**
   * @internal
   */
  static schema = TokenErc721ContractSchema;

  public metadata: ContractMetadata<TokenERC721, typeof NFTCollection.schema>;
  public roles: ContractRoles<
    TokenERC721,
    typeof NFTCollection.contractRoles[number]
  >;
  public royalty: ContractRoyalty<TokenERC721, typeof NFTCollection.schema>;
  public primarySale: ContractPrimarySale<TokenERC721>;
  public encoder: ContractEncoder<TokenERC721>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC721>(
      network,
      address,
      NFTCollection.contractFactory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      NFTCollection.schema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      NFTCollection.contractRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
    this.primarySale = new ContractPrimarySale(this.contractWrapper);
    this.encoder = new ContractEncoder(this.contractWrapper);
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Mint an NFT to the connected wallet
   *
   * @remarks See {@link NFTCollection.mintTo}
   * ```
   */
  public async mint(
    metadata: NFTMetadataInput,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    return this.mintTo(await this.contractWrapper.getSignerAddress(), metadata);
  }

  /**
   * Mint a unique NFT
   *
   * @remarks Mint a unique NFT to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const toAddress = "{{wallet_address}}";
   *
   * // Custom metadata of the NFT, note that you can fully customize this metadata with other properties.
   * const metadata = {
   *   name: "Cool NFT",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * };
   *
   * const tx = await contract.mintTo(toAddress, metadata);
   * const receipt = tx.receipt; // the transaction receipt
   * const tokenId = tx.id; // the id of the NFT minted
   * const nft = await tx.data(); // (optional) fetch details of minted NFT
   * ```
   */
  public async mintTo(
    to: string,
    metadata: NFTMetadataInput,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    const uri = await this.storage.uploadMetadata(
      CommonNFTInput.parse(metadata),
    );
    const receipt = await this.contractWrapper.sendTransaction("mintTo", [
      to,
      uri,
    ]);
    const event = this.contractWrapper.parseLogs<TokenMintedEvent>(
      "TokenMinted",
      receipt?.logs,
    );
    if (event.length === 0) {
      throw new Error("TokenMinted event not found");
    }
    const id = event[0].args.tokenIdMinted;
    return {
      id,
      receipt,
      data: () => this.get(id.toString()),
    };
  }

  /**
   * Mint Many NFTs to the connected wallet
   *
   * @remarks See {@link NFTCollection.mintBatchTo}
   * ```
   */
  public async mintBatch(
    metadatas: NFTMetadataInput[],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    return this.mintBatchTo(
      await this.contractWrapper.getSignerAddress(),
      metadatas,
    );
  }

  /**
   * Mint Many unique NFTs
   *
   * @remarks Mint many unique NFTs at once to a specified wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to mint the NFT to
   * const toAddress = "{{wallet_address}}";
   *
   * // Custom metadata of the NFTs you want to mint.
   * const metadatas = [{
   *   name: "Cool NFT #1",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * }, {
   *   name: "Cool NFT #2",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/other/image.png"),
   * }];
   *
   * const tx = await contract.mintBatchTo(toAddress, metadatas);
   * const receipt = tx[0].receipt; // same transaction receipt for all minted NFTs
   * const firstTokenId = tx[0].id; // token id of the first minted NFT
   * const firstNFT = await tx[0].data(); // (optional) fetch details of the first minted NFT
   * ```
   */
  public async mintBatchTo(
    to: string,
    metadatas: NFTMetadataInput[],
  ): Promise<TransactionResultWithId<NFTMetadataOwner>[]> {
    const { metadataUris: uris } = await this.storage.uploadMetadataBatch(
      metadatas.map((m) => CommonNFTInput.parse(m)),
    );
    const encoded = uris.map((uri) =>
      this.contractWrapper.readContract.interface.encodeFunctionData("mintTo", [
        to,
        uri,
      ]),
    );
    const receipt = await this.contractWrapper.multiCall(encoded);
    const events = this.contractWrapper.parseLogs<TokenMintedEvent>(
      "TokenMinted",
      receipt.logs,
    );
    if (events.length === 0 || events.length < metadatas.length) {
      throw new Error("TokenMinted event not found, minting failed");
    }
    return events.map((e) => {
      const id = e.args.tokenIdMinted;
      return {
        id,
        receipt,
        data: () => this.get(id),
      };
    });
  }

  /** ******************************
   * SIGNATURE FUNCTIONS
   * // TODO signature logic should be extracted out to be re-used
   *******************************/

  /**
   * Mint a dynamicly generated NFT
   *
   * @remarks Mint an dynamic NFT with a previously generated signature.
   *
   * @example
   * ```javascript
   * // see how to craft a payload to sign in the `generateSignature()` documentation
   * const { mintRequest, signature } = contract.generateSignature(payload);
   *
   * // now anyone can mint the NFT
   * const tx = contract.mintWithSignature(mintRequest, signature);
   * const receipt = tx.receipt; // the mint transaction receipt
   * const mintedId = tx.id; // the id of the NFT minted
   * const mintedNFT = await tx.data(); // (optional) fetch the details of the minted NFT
   * ```
   * @param signedPayload - the previously generated payload and signature with {@link NFTCollection.generateSignature}
   */
  public async mintWithSignature(
    signedPayload: SignedPayload,
  ): Promise<TransactionResultWithId<NFTMetadataOwner>> {
    const mintRequest = signedPayload.payload;
    const signature = signedPayload.signature;
    const message = {
      ...this.mapPayloadToContractStruct(mintRequest),
      uri: mintRequest.uri,
    };
    const overrides = await this.contractWrapper.getCallOverrides();
    await setErc20Allowance(
      this.contractWrapper,
      BigNumber.from(message.price),
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
      data: () => this.get(id),
    };
  }

  public async verify(signedPayload: SignedPayload): Promise<boolean> {
    const mintRequest = signedPayload.payload;
    const signature = signedPayload.signature;
    const message = this.mapPayloadToContractStruct(mintRequest);
    const v = await this.contractWrapper.readContract.verify(
      { ...message, uri: mintRequest.uri },
      signature,
    );
    return v[0];
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
   * const now = Math.floor(Date.now() / 1000);
   * const payload = {
   *   metadta: nftMetadata, // The NFT to mint
   *   to: {{wallet_address}}, // Who will receive the NFT (or AddressZero for anyone)
   *   price: 0.5, // the price to pay for minting
   *   currencyAddress: NATIVE_TOKEN_ADDRESS, // the currency to pay with
   *   mintStartTimeEpochSeconds: now, // can mint anytime from now
   *   mintEndTimeEpochSeconds: now + 60 * 60 * 24 * 7, // to 24h from now
   * };
   *
   * const { mintRequest, signature } = contract.generateSignature(payload);
   * // now anynone can use these to mint the NFT using `mintWithSignature()`
   * ```
   * @param mintRequest - the payload to sign
   * @returns the signed payload and the corresponding signature
   */
  public async generateSignature(
    mintRequest: PayloadToSign,
  ): Promise<SignedPayload> {
    return (await this.generateSignatureBatch([mintRequest]))[0];
  }

  /**
   * Genrate a batch of signatures that can be used to mint many dynamic NFTs.
   *
   * @remarks See {@link NFTCollection.generateSignature}
   *
   * @param mintRequests
   * @returns an array of payloads and signatures
   */
  public async generateSignatureBatch(
    mintRequests: PayloadToSign[],
  ): Promise<SignedPayload[]> {
    const resolveId = (mintRequest: FilledSignaturePayload): string => {
      if (mintRequest.uid === undefined) {
        const buffer = Buffer.alloc(16);
        uuidv4({}, buffer);
        return hexlify(toUtf8Bytes(buffer.toString("hex")));
      } else {
        return hexlify(mintRequest.uid as string);
      }
    };

    await this.roles.verify(
      ["minter"],
      await this.contractWrapper.getSignerAddress(),
    );

    const parsedRequests: FilledSignaturePayload[] = mintRequests.map((m) =>
      SignaturePayloadInput.parse(m),
    );

    const { metadataUris: uris } = await this.storage.uploadMetadataBatch(
      parsedRequests.map((r) => r.metadata),
    );

    const chainId = await this.contractWrapper.getChainID();
    const signer = this.contractWrapper.getSigner();
    invariant(signer, "No signer available");

    return await Promise.all(
      parsedRequests.map(async (m, i) => {
        const uid = resolveId(m);
        const uri = uris[i];
        const finalPayload = SignaturePayloadOutput.parse({
          ...m,
          uid,
          uri,
        });
        const signature = await this.contractWrapper.signTypedData(
          signer,
          {
            name: "SignatureMint721",
            version: "1",
            chainId,
            verifyingContract: this.contractWrapper.readContract.address,
          },
          { MintRequest },
          {
            ...this.mapPayloadToContractStruct(finalPayload),
            uri,
            uid,
          },
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
    mintRequest: PayloadWithUri,
  ): ITokenERC721.MintRequestStructOutput {
    return {
      to: mintRequest.to,
      price: mintRequest.price,
      currency: mintRequest.currencyAddress,
      validityEndTimestamp: mintRequest.mintEndTimeEpochSeconds,
      validityStartTimestamp: mintRequest.mintStartTimeEpochSeconds,
      uid: mintRequest.uid,
      royaltyRecipient: mintRequest.royaltyRecipient,
      primarySaleRecipient: mintRequest.primarySaleRecipient,
    } as ITokenERC721.MintRequestStructOutput;
  }
}
