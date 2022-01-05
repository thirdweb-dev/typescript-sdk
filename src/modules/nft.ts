import {
  ERC20__factory,
  NFT,
  NFT__factory,
  SignatureMint721,
  SignatureMint721__factory,
} from "@3rdweb/contracts";

import { MintedBatchEvent, MintedEvent } from "@3rdweb/contracts/dist/NFT";
import {
  MintRequestStructOutput,
  TokenMintedEvent,
  MintWithSignatureEvent,
} from "@3rdweb/contracts/dist/SignatureMint721";
import { AddressZero } from "@ethersproject/constants";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";
import { v4 as uuidv4 } from "uuid";
import {
  ModuleType,
  NATIVE_TOKEN_ADDRESS,
  RestrictedTransferError,
  Role,
  RolesMap,
} from "../common";
import { invariant } from "../common/invariant";
import { NFTMetadata, NFTMetadataOwner } from "../common/nft";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject } from "../core/types";
import { ITransferable } from "../interfaces/contracts/ITransferable";
import { ISignatureMinter } from "../interfaces/modules/ISignatureMinter";
import { NewSignaturePayload } from "../types/signature-minting/NewSignaturePayload";
import { SignaturePayload } from "../types/signature-minting/SignaturePayload";

const MintRequest = [
  { name: "to", type: "address" },
  { name: "uri", type: "string" },
  { name: "price", type: "uint256" },
  { name: "currency", type: "address" },
  { name: "validityStartTimestamp", type: "uint128" },
  { name: "validityEndTimestamp", type: "uint128" },
  { name: "uid", type: "bytes32" },
];

/**
 * Access this module by calling {@link ThirdwebSDK.getNFTModule}
 * @public
 */
export class NFTModule
  extends ModuleWithRoles<SignatureMint721>
  implements ITransferable, ISignatureMinter
{
  public static moduleType: ModuleType = ModuleType.NFT;

  public static roles = [
    RolesMap.admin,
    RolesMap.minter,
    RolesMap.transfer,
  ] as const;

  protected getModuleRoles(): readonly Role[] {
    return NFTModule.roles;
  }

  /**
   * @internal
   */
  protected connectContract(): SignatureMint721 {
    return SignatureMint721__factory.connect(
      this.address,
      this.providerOrSigner,
    );
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return NFTModule.moduleType;
  }

  private _shouldCheckVersion = true;
  private _isV1 = false;
  private v1Contract?: NFT;

  /**
   * Check if contract is v1 or v2. If the contract doesn't have nextTokenIdToMint = v1 contract.
   */
  async isV1(): Promise<boolean> {
    if (this._shouldCheckVersion) {
      try {
        await this.readOnlyContract.nextTokenIdToMint();
        this._isV1 = false;
      } catch (e) {
        this._isV1 = true;
        this.v1Contract = NFT__factory.connect(
          this.address,
          this.providerOrSigner,
        );
      }
      this._shouldCheckVersion = false;
    }
    return this._isV1;
  }

  /**
   * Fetches an NFT from storage with the resolved metadata.
   *
   * @param tokenId - The id of the token to fetch.
   * @returns - The NFT metadata.
   */
  public async get(tokenId: string): Promise<NFTMetadata> {
    const storage = this.sdk.getStorage();
    const uri = await this.readOnlyContract.tokenURI(tokenId);
    const metadata = JSON.parse(await storage.get(uri));
    return {
      ...metadata,
      id: tokenId,
      uri,
      image: storage.resolveFullUrl(metadata.image),
    };
  }

  public async getAll(): Promise<NFTMetadata[]> {
    let maxId: number;
    if (await this.isV1()) {
      maxId = (await this.v1Contract?.nextTokenId())?.toNumber() as number;
    } else {
      maxId = (await this.readOnlyContract.nextTokenIdToMint()).toNumber();
    }
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  public async getWithOwner(tokenId: string): Promise<NFTMetadataOwner> {
    const [owner, metadata] = await Promise.all([
      this.ownerOf(tokenId),
      this.get(tokenId),
    ]);

    return { owner, metadata };
  }

  public async getAllWithOwner(): Promise<NFTMetadataOwner[]> {
    let maxId: number;
    if (await this.isV1()) {
      maxId = (await this.v1Contract?.nextTokenId())?.toNumber() as number;
    } else {
      maxId = (await this.readOnlyContract.nextTokenIdToMint()).toNumber();
    }
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) =>
        this.getWithOwner(i.toString()),
      ),
    );
  }

  /**
   * Checks the owner of a particular NFT
   *
   * @param tokenId - ID of the NFT to get the owner of
   * @returns the owner of the token, or a zero address if the
   * token has been burned
   */
  public async ownerOf(tokenId: string): Promise<string> {
    try {
      return await this.readOnlyContract.ownerOf(tokenId);
    } catch (e) {
      return AddressZero;
    }
  }

  public async getOwned(_address?: string): Promise<NFTMetadata[]> {
    const address = _address ? _address : await this.getSignerAddress();
    const balance = await this.readOnlyContract.balanceOf(address);
    const indices = Array.from(Array(balance.toNumber()).keys());
    const tokenIds = await Promise.all(
      indices.map((i) => this.readOnlyContract.tokenOfOwnerByIndex(address, i)),
    );
    return await Promise.all(
      tokenIds.map((tokenId) => this.get(tokenId.toString())),
    );
  }

  public async totalSupply(): Promise<BigNumber> {
    return await this.readOnlyContract.totalSupply();
  }

  public async balanceOf(address: string): Promise<BigNumber> {
    return await this.readOnlyContract.balanceOf(address);
  }

  public async balance(): Promise<BigNumber> {
    return await this.balanceOf(await this.getSignerAddress());
  }

  public async isApproved(address: string, operator: string): Promise<boolean> {
    return await this.readOnlyContract.isApprovedForAll(address, operator);
  }
  // write functions
  public async setApproval(
    operator: string,
    approved = true,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("setApprovalForAll", [
      operator,
      approved,
    ]);
  }

  public async transfer(
    to: string,
    tokenId: string,
  ): Promise<TransactionReceipt> {
    if (await this.isTransferRestricted()) {
      throw new RestrictedTransferError(this.address);
    }

    const from = await this.getSignerAddress();
    return await this.sendTransaction(
      "safeTransferFrom(address,address,uint256)",
      [from, to, tokenId],
    );
  }

  // owner functions
  public async mint(metadata: MetadataURIOrObject): Promise<NFTMetadata> {
    return await this.mintTo(await this.getSignerAddress(), metadata);
  }

  private async _v1MintTo(
    to: string,
    metadata: MetadataURIOrObject,
  ): Promise<NFTMetadata> {
    invariant(this.v1Contract !== undefined, "v1 contract is undefined");
    const uri = await this.sdk.getStorage().uploadMetadata(metadata);
    const receipt = await this.sendContractTransaction(
      this.v1Contract,
      "mintNFT",
      [to, uri],
    );
    const events = this.parseLogs<MintedEvent>(
      "Minted",
      receipt?.logs,
      this.v1Contract,
    );
    if (events.length === 0) {
      throw new Error("No Minted event found, failed to mint");
    }
    return await this.get(events[0].args.tokenId.toString());
  }

  public async mintTo(
    to: string,
    metadata: MetadataURIOrObject,
  ): Promise<NFTMetadata> {
    if (await this.isV1()) {
      return await this._v1MintTo(to, metadata);
    }

    const uri = await this.sdk.getStorage().uploadMetadata(metadata);
    const receipt = await this.sendTransaction("mintTo", [to, uri]);
    const event = this.parseLogs<TokenMintedEvent>(
      "TokenMinted",
      receipt?.logs,
    );
    if (event.length === 0) {
      throw new Error("TokenMinted event not found");
    }

    const tokenId = event[0].args.tokenIdMinted;
    return await this.get(tokenId.toString());
  }

  public async mintBatch(
    metadatas: MetadataURIOrObject[],
  ): Promise<NFTMetadata[]> {
    return await this.mintBatchTo(await this.getSignerAddress(), metadatas);
  }

  private async _v1MintBatchTo(
    to: string,
    metadatas: MetadataURIOrObject[],
  ): Promise<NFTMetadata[]> {
    invariant(this.v1Contract !== undefined, "v1 contract is undefined");

    const baseUri = await this.sdk.getStorage().uploadMetadataBatch(metadatas);
    const uris = Array.from(Array(metadatas.length).keys()).map(
      (i) => `${baseUri}${i}/`,
    );
    const receipt = await this.sendContractTransaction(
      this.v1Contract,
      "mintNFTBatch",
      [to, uris],
    );
    const events = this.parseLogs<MintedBatchEvent>(
      "MintedBatch",
      receipt?.logs,
      this.v1Contract,
    );
    if (events.length === 0) {
      throw new Error("No MintedBatch event found, failed to mint");
    }

    const tokenIds = events[0].args.tokenIds;
    return await Promise.all(
      tokenIds.map((tokenId: BigNumber) => this.get(tokenId.toString())),
    );
  }

  public async mintBatchTo(
    to: string,
    metadatas: MetadataURIOrObject[],
  ): Promise<NFTMetadata[]> {
    if (await this.isV1()) {
      return await this._v1MintBatchTo(to, metadatas);
    }

    const baseUri = await this.sdk.getStorage().uploadMetadataBatch(metadatas);
    const uris = Array.from(Array(metadatas.length).keys()).map(
      (i) => `${baseUri}${i}/`,
    );

    const multicall = uris.map((uri) =>
      this.contract.interface.encodeFunctionData("mintTo", [to, uri]),
    );

    const receipt = await this.sendTransaction("multicall", [multicall]);
    const events = await this.parseLogs<TokenMintedEvent>(
      "TokenMinted",
      receipt.logs,
    );
    if (events.length === 0 || events.length < metadatas.length) {
      throw new Error("TokenMinted event not found, minting failed");
    }

    const tokenIds = events.map((e) => e.args.tokenIdMinted);
    return await Promise.all(
      tokenIds.map((tokenId: BigNumber) => this.get(tokenId.toString())),
    );
  }

  public async burn(tokenId: BigNumberish): Promise<TransactionReceipt> {
    return await this.sendTransaction("burn", [tokenId]);
  }

  public async transferFrom(
    from: string,
    to: string,
    tokenId: BigNumberish,
  ): Promise<TransactionReceipt> {
    return await this.sendTransaction("transferFrom", [from, to, tokenId]);
  }

  public async setRoyaltyBps(amount: number): Promise<TransactionReceipt> {
    // TODO: reduce this duplication and provide common functions around
    // royalties through an interface. Currently this function is
    // duplicated across 4 modules
    const { metadata } = await this.getMetadata();
    const encoded: string[] = [];
    if (!metadata) {
      throw new Error("No metadata found, this module might be invalid!");
    }

    metadata.seller_fee_basis_points = amount;
    const uri = await this.sdk.getStorage().uploadMetadata(
      {
        ...metadata,
      },
      this.address,
      await this.getSignerAddress(),
    );
    encoded.push(
      this.contract.interface.encodeFunctionData("setRoyaltyBps", [amount]),
    );
    encoded.push(
      this.contract.interface.encodeFunctionData("setContractURI", [uri]),
    );
    return await this.sendTransaction("multicall", [encoded]);
  }

  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await this.sdk.getStorage().uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }

  /**
   * Gets the royalty BPS (basis points) of the contract
   *
   * @returns - The royalty BPS
   */
  public async getRoyaltyBps(): Promise<BigNumberish> {
    return await this.readOnlyContract.royaltyBps();
  }

  /**
   * Gets the address of the royalty recipient
   *
   * @returns - The royalty BPS
   */
  public async getRoyaltyRecipientAddress(): Promise<string> {
    const metadata = await this.getMetadata();
    if (metadata.metadata?.fee_recipient !== undefined) {
      return metadata.metadata.fee_recipient;
    }
    return "";
  }

  public async isTransferRestricted(): Promise<boolean> {
    return this.readOnlyContract.transfersRestricted();
  }

  public async setRestrictedTransfer(
    restricted = false,
  ): Promise<TransactionReceipt> {
    await this.onlyRoles(["admin"], await this.getSignerAddress());
    return await this.sendTransaction("setRestrictedTransfer", [restricted]);
  }

  public async mintWithSignature(
    req: SignaturePayload,
    signature: string,
  ): Promise<BigNumber> {
    const message = { ...this.mapPayload(req), uri: req.uri };

    const overrides = await this.getCallOverrides();
    await this.setAllowance(
      BigNumber.from(message.price),
      req.currencyAddress,
      overrides,
    );

    const receipt = await this.sendTransaction(
      "mintWithSignature",
      [message, signature],
      overrides,
    );

    const t = await this.parseLogs<MintWithSignatureEvent>(
      "MintWithSignature",
      receipt.logs,
    );
    if (t.length === 0) {
      throw new Error("No MintWithSignature event found");
    }

    return t[0].args.tokenIdMinted;
  }

  public async verify(
    mintRequest: SignaturePayload,
    signature: string,
  ): Promise<boolean> {
    const message = this.mapPayload(mintRequest);
    const v = await this.readOnlyContract.verify(
      { ...message, uri: mintRequest.uri },
      signature,
    );
    return v[0];
  }

  public async generateSignatureBatch(
    payloads: NewSignaturePayload[],
  ): Promise<{ payload: SignaturePayload; signature: string }[]> {
    const resolveId = (mintRequest: NewSignaturePayload): string => {
      if (mintRequest.id === undefined) {
        console.warn("mintRequest.id is an empty string, generating uuid-v4");
        const buffer = Buffer.alloc(16);
        uuidv4({}, buffer);
        return hexlify(toUtf8Bytes(buffer.toString("hex")));
      } else {
        return hexlify(mintRequest.id as string);
      }
    };

    await this.onlyRoles(["minter"], await this.getSignerAddress());

    const cid = await this.sdk
      .getStorage()
      .uploadMetadataBatch(payloads.map((r) => r.metadata));

    const chainId = await this.getChainID();
    const from = await this.getSignerAddress();
    const signer = (await this.getSigner()) as Signer;

    return await Promise.all(
      payloads.map(async (m, i) => {
        const id = resolveId(m);
        const uri = `${cid}${i}`;
        return {
          payload: {
            ...m,
            id,
            uri,
          },
          signature: (
            await this.signTypedData(
              signer,
              from,
              {
                name: "SignatureMint721",
                version: "1",
                chainId,
                verifyingContract: this.address,
              },
              { MintRequest },
              {
                uri,
                ...(this.mapPayload(m) as any),
                uid: id,
              },
            )
          ).toString(),
        };
      }),
    );
  }

  public async generateSignature(
    mintRequest: NewSignaturePayload,
  ): Promise<{ payload: SignaturePayload; signature: string }> {
    return (await this.generateSignatureBatch([mintRequest]))[0];
  }

  /**
   * Maps a payload to the format expected by the contract
   *
   * @internal
   *
   * @param mintRequest - The payload to map.
   * @returns - The mapped payload.
   */
  private mapPayload(
    mintRequest: SignaturePayload | NewSignaturePayload,
  ): MintRequestStructOutput {
    return {
      to: mintRequest.to,
      price: mintRequest.price,
      currency: mintRequest.currencyAddress,
      validityEndTimestamp: mintRequest.mintEndTimeEpochSeconds,
      validityStartTimestamp: mintRequest.mintStartTimeEpochSeconds,
      uid: mintRequest.id,
    } as MintRequestStructOutput;
  }

  // TODO: write in common place and stop duping
  private async setAllowance(
    value: BigNumber,
    currencyAddress: string,
    overrides: any,
  ): Promise<any> {
    if (
      currencyAddress === NATIVE_TOKEN_ADDRESS ||
      currencyAddress === AddressZero
    ) {
      overrides["value"] = value;
    } else {
      const erc20 = ERC20__factory.connect(
        currencyAddress,
        this.providerOrSigner,
      );
      const owner = await this.getSignerAddress();
      const spender = this.address;
      const allowance = await erc20.allowance(owner, spender);

      if (allowance.lt(value)) {
        await this.sendContractTransaction(erc20, "increaseAllowance", [
          spender,
          value.sub(allowance),
        ]);
      }
      return overrides;
    }
  }
}
