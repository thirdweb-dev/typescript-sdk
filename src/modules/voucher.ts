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
import {
  ModuleType,
  NATIVE_TOKEN_ADDRESS,
  NFTMetadata,
  NFTMetadataOwner,
  Role,
  RolesMap,
} from "../common";
import { ModuleWithRoles } from "../core/module";
import { MetadataURIOrObject } from "../core/types";
import { ISignatureMinter } from "../interfaces/modules";
import { NewSignatureMint } from "../types/signature-minting/NewMintRequest";
import { SignatureMint } from "../types/signature-minting/SignatureMint";
import { NFTModule } from "./nft";

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
  extends ModuleWithRoles<SignatureMint721>
  implements ISignatureMinter
{
  public static moduleType: ModuleType = ModuleType.VOUCHER as const;

  public static roles = [
    RolesMap.admin,
    RolesMap.minter,
    RolesMap.pauser,
    RolesMap.transfer,
  ] as const;

  private nftModule = new NFTModule(
    this.providerOrSigner,
    this.address,
    this.options,
    this.sdk,
  );

  protected getModuleRoles(): readonly Role[] {
    return VoucherModule.roles;
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
    return VoucherModule.moduleType;
  }

  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await this.sdk.getStorage().uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }

  public async mintWithSignature(
    req: SignatureMint,
    signature: string,
  ): Promise<BigNumber> {
    const message = { ...this.mapVoucher(req), uri: req.uri };

    const overrides = await this.getCallOverrides();
    await this.setAllowance(
      BigNumber.from(message.price),
      req.currencyAddress,
      overrides,
    );

    const receipt = await this.sendTransaction(
      "mint",
      [message, signature],
      overrides,
    );

    const t = await this.parseLogs<TokensMintedEvent>(
      "TokensMinted",
      receipt.logs,
    );
    if (t.length === 0) {
      throw new Error("No TokensMinted event found");
    }

    return t[0].args.tokenIdMinted;
  }

  // public async mintBatch(
  //   tokenMetadata: { req: Voucher; signature: string }[],
  // ): Promise<string[]> {
  //   return Promise.all();
  // }

  public async verify(
    mintRequest: SignatureMint,
    signature: string,
  ): Promise<boolean> {
    const message = this.mapVoucher(mintRequest);
    return await this.readOnlyContract.verify(
      { ...message, uri: mintRequest.uri },
      signature,
    );
  }

  public async generateSignatureBatch(
    mintRequests: NewSignatureMint[],
  ): Promise<{ voucher: SignatureMint; signature: string }[]> {
    const resolveId = (mintRequest: NewSignatureMint): string => {
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
      .uploadMetadataBatch(mintRequests.map((r) => r.metadata));

    const chainId = await this.getChainID();
    const from = await this.getSignerAddress();
    const signer = (await this.getSigner()) as Signer;

    return await Promise.all(
      mintRequests.map(async (m, i) => {
        const id = resolveId(m);
        const uri = `${cid}${i}`;
        return {
          voucher: {
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
                ...(this.mapVoucher(m) as any),
                uid: id,
              },
            )
          ).toString(),
        };
      }),
    );
  }

  public async generateSignature(
    mintRequest: NewSignatureMint,
  ): Promise<{ voucher: SignatureMint; signature: string }> {
    return (await this.generateSignatureBatch([mintRequest]))[0];
  }

  private mapVoucher(
    mintRequest: SignatureMint | NewSignatureMint,
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
    return await this.nftModule.get(tokenId.toString());
  }

  public async getOwned(_address?: string): Promise<NFTMetadata[]> {
    return await this.nftModule.getOwned(_address);
  }

  public async totalSupply(): Promise<BigNumber> {
    return await this.nftModule.totalSupply();
  }

  public async balanceOf(address: string): Promise<BigNumber> {
    return await this.nftModule.balanceOf(address);
  }

  public async balance(): Promise<BigNumber> {
    return await this.balanceOf(await this.getSignerAddress());
  }

  public async getAllWithOwner(): Promise<NFTMetadataOwner[]> {
    return await this.nftModule.getAllWithOwner();
  }

  public async ownerOf(tokenId: string): Promise<string> {
    return await this.nftModule.ownerOf(tokenId);
  }

  public async transfer(
    to: string,
    tokenId: string,
  ): Promise<TransactionReceipt> {
    return await this.nftModule.transfer(to, tokenId);
  }
}
