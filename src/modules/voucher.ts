import {
  ERC20__factory,
  SignatureMint721,
  SignatureMint721__factory,
} from "@3rdweb/contracts";
import {
  MintRequestStructOutput,
  TokensMintedEvent,
} from "@3rdweb/contracts/dist/SignatureMint721";
import { AddressZero } from "@ethersproject/constants";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { ModuleType, NATIVE_TOKEN_ADDRESS, NFTMetadata } from "../common";
import { Module } from "../core/module";
import { MetadataURIOrObject } from "../core/types";
import { IVoucher } from "../interfaces/modules";
import { NewMintRequest } from "./../types/voucher/NewMintRequest";
import { Voucher } from "./../types/voucher/Voucher";

const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

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
 * Access this module by calling {@link ThirdwebSDK.getVoucherModule}
 *
 * @alpha
 * @public
 */
export class VoucherModule
  extends Module<SignatureMint721>
  implements IVoucher
{
  public static moduleType: ModuleType = ModuleType.VOUCHER as const;

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
    return VoucherModule.moduleType;
  }

  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await this.sdk.getStorage().uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }

  public async mint(req: Voucher, signature: string): Promise<BigNumber> {
    const message = { ...this.mapVoucher(req), uri: req.uri };

    const overrides = await this.getCallOverrides();
    await this.setAllowance(
      BigNumber.from(message.price),
      req.currencyAddress,
      overrides,
    );

    const reciept = await this.sendTransaction(
      "mint",
      [message, signature],
      overrides,
    );

    const t = await this.parseLogs<TokensMintedEvent>(
      "TokensMinted",
      reciept.logs,
    );
    if (t.length === 0) {
      throw new Error("No TokensMinted event found");
    }

    return t[0].args.tokenIdMinted;
  }

  mintBatch(tokenMetadata: NewMintRequest[]): Promise<string[]> {
    throw new Error("Method not implemented.");
  }

  public async verify(
    mintRequest: Voucher,
    signature: string,
  ): Promise<boolean> {
    const message = this.mapVoucher(mintRequest);
    return await this.readOnlyContract.verify(
      { ...message, uri: mintRequest.uri },
      signature,
    );
  }

  claim(mintRequest: Voucher, signature: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async generateSignature(
    mintRequest: NewMintRequest,
  ): Promise<{ voucher: Voucher; signature: string }> {
    let id = mintRequest.id;
    if (mintRequest.id === undefined) {
      console.warn("mintRequest.id is an empty string, generating uuid-v4");
      const buffer = Buffer.alloc(16);
      uuidv4({}, buffer);
      id = hexlify(toUtf8Bytes(buffer.toString("hex")));
    } else {
      id = hexlify(id as string);
    }

    const metadataUri = await this.sdk
      .getStorage()
      .uploadMetadata(mintRequest.metadata);

    const from = await this.getSignerAddress();
    const signer = (await this.getSigner()) as Signer;

    const message = {
      uri: metadataUri,
      ...(this.mapVoucher(mintRequest) as any),
      uid: id,
    } as MintRequestStructOutput;
    const chainId = await this.getChainID();
    const signature = await this.signTypedData(
      signer,
      from,
      {
        name: "SignatureMint721",
        version: "1",
        chainId,
        verifyingContract: this.address,
      },
      { MintRequest },
      message,
    );

    return {
      voucher: {
        ...mintRequest,
        id,
        uri: metadataUri,
      },
      signature: signature.toString(),
    };
  }

  private mapVoucher(
    mintRequest: Voucher | NewMintRequest,
  ): MintRequestStructOutput {
    return {
      to: mintRequest.to,
      price: mintRequest.price,
      currency: mintRequest.currencyAddress,
      validityEndTimestamp: mintRequest.voucherEndTimeEpochSeconds,
      validityStartTimestamp: mintRequest.voucherStartTimeEpochSeconds,
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

  /**
   * Fetches an NFT from storage with the resolved metadata.
   *
   * @param tokenId - The id of the token to fetch.
   * @returns - The NFT metadata.
   */
  public async get(tokenId: BigNumberish): Promise<NFTMetadata> {
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
}
