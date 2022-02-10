import { ContractWrapper } from "./contract-wrapper";
import { DropERC1155, TokenERC1155 } from "@3rdweb/contracts";
import { BigNumber, BigNumberish, BytesLike } from "ethers";
import { NFTMetadata } from "../../schema/tokens/common";
import { IStorage } from "../interfaces";
import { NetworkOrSignerOrProvider, TransactionResultPromise } from "../types";
import { NotFoundError, RestrictedTransferError } from "../../common";
import { UpdateableNetwork } from "../interfaces/contract";
import { SDKOptions, SDKOptionsSchema } from "../../schema/sdk-options";
import {
  BundleMetadata,
  BundleMetadataOutputSchema,
} from "../../schema/tokens/bundle";
import { fetchTokenMetadata } from "../../common/nft";

export class Erc1155<T extends DropERC1155 | TokenERC1155>
  implements UpdateableNetwork
{
  protected contractWrapper: ContractWrapper<T>;
  protected storage: IStorage;
  protected options: SDKOptions;

  constructor(
    contractWrapper: ContractWrapper<T>,
    storage: IStorage,
    options: SDKOptions = {},
  ) {
    this.contractWrapper = contractWrapper;
    this.storage = storage;
    try {
      this.options = SDKOptionsSchema.parse(options);
    } catch (optionParseError) {
      console.error(
        "invalid contract options object passed, falling back to default options",
        optionParseError,
      );
      this.options = SDKOptionsSchema.parse({});
    }
  }

  /**
   * @internal
   */
  onNetworkUpdated(network: NetworkOrSignerOrProvider): void {
    this.contractWrapper.updateSignerOrProvider(network);
  }

  getAddress(): string {
    return this.contractWrapper.readContract.address;
  }

  /** ******************************
   * READ FUNCTIONS
   *******************************/

  /**
   * Get a single NFT Metadata
   *
   * @example
   * ```javascript
   * const nft = await contract.get("0");
   * console.log(nft);
   * ```
   * @param tokenId - the tokenId of the NFT to retrieve
   * @returns The NFT metadata
   */
  public async get(tokenId: BigNumberish): Promise<BundleMetadata> {
    const [supply, metadata] = await Promise.all([
      this.contractWrapper.readContract
        .totalSupply(tokenId)
        .catch(() => BigNumber.from(0)),
      this.getTokenMetadata(tokenId),
    ]);
    return BundleMetadataOutputSchema.parse({
      supply,
      metadata,
    });
  }

  /**
   * Get All NFTs
   *
   * @remarks Get all the data associated with every NFT in this contract.
   *
   * @example
   * ```javascript
   * const nfts = await contract.getAll();
   * console.log(nfts);
   * ```
   * @returns The NFT metadata for all NFTs queried.
   */
  public async getAll(): Promise<BundleMetadata[]> {
    const maxId = (
      await this.contractWrapper.readContract.nextTokenIdToMint()
    ).toNumber();
    return await Promise.all(
      Array.from(Array(maxId).keys()).map((i) => this.get(i.toString())),
    );
  }

  /**
   * Get Owned NFTs
   *
   * @remarks Get all the data associated with the NFTs owned by a specific wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet to get the NFTs of
   * const address = "{{wallet_address}}";
   * const nfts = await contract.getOwned(address);
   * console.log(nfts);
   * ```
   *
   * @returns The NFT metadata for all NFTs in the contract.
   */
  public async getOwned(_address?: string): Promise<BundleMetadata[]> {
    const address = _address
      ? _address
      : await this.contractWrapper.getSignerAddress();
    const maxId = await this.contractWrapper.readContract.nextTokenIdToMint();
    const balances = await this.contractWrapper.readContract.balanceOfBatch(
      Array(maxId.toNumber()).fill(address),
      Array.from(Array(maxId.toNumber()).keys()),
    );

    const ownedBalances = balances
      .map((b, i) => {
        return {
          tokenId: i,
          balance: b,
        };
      })
      .filter((b) => b.balance.gt(0));
    return await Promise.all(
      ownedBalances.map(async (b) => await this.get(b.tokenId.toString())),
    );
  }

  /**
   * Returns the total supply of a specific token
   * @param tokenId - The token ID to get the total supply of
   * @returns the total supply
   */
  public async totalSupply(tokenId: BigNumberish): Promise<BigNumber> {
    return await this.contractWrapper.readContract.totalSupply(tokenId);
  }

  /**
   * Get NFT Balance
   *
   * @remarks Get a wallets NFT balance (number of NFTs in this contract owned by the wallet).
   *
   * @example
   * ```javascript
   * // Address of the wallet to check NFT balance
   * const address = "{{wallet_address}}";
   *
   * const balance = await contract.balanceOf(address);
   * console.log(balance);
   * ```
   */
  public async balanceOf(
    address: string,
    tokenId: BigNumberish,
  ): Promise<BigNumber> {
    return await this.contractWrapper.readContract.balanceOf(address, tokenId);
  }

  /**
   * Get NFT Balance for the currently connected wallet
   */
  public async balance(tokenId: BigNumberish): Promise<BigNumber> {
    return await this.balanceOf(
      await this.contractWrapper.getSignerAddress(),
      tokenId,
    );
  }

  /**
   * Get whether users can transfer NFTs from this contract
   */
  public async isTransferRestricted(): Promise<boolean> {
    return this.contractWrapper.readContract.isTransferRestricted();
  }

  /**
   * Get whether this wallet has approved transfers from the given operator
   * @param address - the wallet address
   * @param operator - the operator address
   */
  public async isApproved(address: string, operator: string): Promise<boolean> {
    return await this.contractWrapper.readContract.isApprovedForAll(
      address,
      operator,
    );
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  /**
   * Transfer a single NFT
   *
   * @remarks Transfer an NFT from the connected wallet to another wallet.
   *
   * @example
   * ```javascript
   * // Address of the wallet you want to send the NFT to
   * const toAddress = "{{wallet_address}}";
   *
   * // The token ID of the NFT you want to send
   * const tokenId = "0";
   *
   * await contract.transfer(toAddress, tokenId);
   * ```
   */
  public async transfer(
    to: string,
    tokenId: BigNumberish,
    amount: BigNumberish,
    data: BytesLike = [0],
  ): TransactionResultPromise {
    if (await this.isTransferRestricted()) {
      throw new RestrictedTransferError(
        await this.contractWrapper.getSignerAddress(),
      );
    }
    const from = await this.contractWrapper.getSignerAddress();
    return {
      receipt: await this.contractWrapper.sendTransaction("safeTransferFrom", [
        from,
        to,
        tokenId,
        amount,
        data,
      ]),
    };
  }

  /**
   * Burn a single NFT
   * @param tokenId - the token Id to burn
   */
  public async burn(
    tokenId: BigNumberish,
    amount: BigNumberish,
  ): TransactionResultPromise {
    const account = await this.contractWrapper.getSignerAddress();
    return {
      receipt: await this.contractWrapper.sendTransaction("burn", [
        account,
        tokenId,
        amount,
      ]),
    };
  }

  /**
   * Approve or remove operator as an operator for the caller. Operators can call transferFrom or safeTransferFrom for any token owned by the caller.
   * @param operator - the operator's address
   * @param approved - whether to approve or remove
   *
   * @internal
   */
  public async setApprovalForAll(
    operator: string,
    approved: boolean,
  ): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction("setApprovalForAll", [
        operator,
        approved,
      ]),
    };
  }

  /**
   * Set whether NFTs in this Contract can be transferred or not.
   * @param restricted whether to restrict or allow transfers
   */
  public async setRestrictedTransfer(
    restricted = false,
  ): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "setRestrictedTransfer",
        [restricted],
      ),
    };
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  protected async getTokenMetadata(
    tokenId: BigNumberish,
  ): Promise<NFTMetadata> {
    const tokenUri = await this.contractWrapper.readContract.uri(tokenId);
    if (!tokenUri) {
      throw new NotFoundError();
    }
    return fetchTokenMetadata(tokenId, tokenUri, this.storage);
  }
}
