import { RPCConnectionHandler } from "../classes/rpc-connection-handler";
import { NetworkOrSignerOrProvider, TransactionResult } from "../types";
import { SDKOptions } from "../../schema";
import invariant from "tiny-invariant";
import { Amount, CurrencyValue } from "../../types";
import {
  fetchCurrencyValue,
  isNativeToken,
  normalizePriceValue,
} from "../../common/currency";
import { NATIVE_TOKEN_ADDRESS } from "../../constants";
import ERC20Abi from "../../../abis/IERC20.json";
import { ContractWrapper } from "../classes/contract-wrapper";
import { IERC20 } from "contracts";
import { BigNumber } from "ethers";
import { TransactionRequest } from "@ethersproject/providers";

/**
 * Connect and Interact with a user wallet
 * @example
 * ```javascript
 * const balance = await sdk.wallet.balance();
 * ```
 * @public
 */
export class UserWallet {
  private connection: RPCConnectionHandler;
  private options: SDKOptions;

  constructor(network: NetworkOrSignerOrProvider, options: SDKOptions) {
    this.connection = new RPCConnectionHandler(network, options);
    this.options = options;
  }

  // TODO connect()
  // TODO disconnect()
  // TODO switchChain()
  // TODO event listener
  // TODO tokens()
  // TODO NFTs()

  // TODO this will become the source of truth of the signer and have every contract read from it
  onNetworkUpdated(network: NetworkOrSignerOrProvider): void {
    this.connection.updateSignerOrProvider(network);
  }

  /**
   * Transfer native or ERC20 tokens from this wallet to another wallet
   * @example
   * ```javascript
   *  // transfer 0.8 ETH
   * await sdk.wallet.transfer("0x...", 0.8);
   *  // transfer 0.8 tokens of `tokenContractAddress`
   * await sdk.wallet.transfer("0x...", 0.8, tokenContractAddress);
   * ```
   * @param to - the account to send funds to
   * @param amount - the amount in tokens
   * @param currencyAddress - Optional - ERC20 contract address of the token to transfer
   */
  async transfer(
    to: string,
    amount: Amount,
    currencyAddress = NATIVE_TOKEN_ADDRESS,
  ): Promise<TransactionResult> {
    const signer = await this.connectedWallet();
    const amountInWei = await normalizePriceValue(
      this.connection.getProvider(),
      amount,
      currencyAddress,
    );
    if (isNativeToken(currencyAddress)) {
      // native token transfer
      const from = await signer.getAddress();
      const tx = await signer.sendTransaction({
        from,
        to,
        value: amountInWei,
      });
      return {
        receipt: await tx.wait(),
      };
    } else {
      // ERC20 token transfer
      return {
        receipt: await this.createErc20(currencyAddress).sendTransaction(
          "transfer",
          [to, amountInWei],
        ),
      };
    }
  }

  /**
   * Fetch the native or ERC20 token balance of this wallet
   * @example
   * ```javascript
   * // native currency balance
   * const balance = await sdk.wallet.balance();
   * // ERC20 token balance
   * const erc20balance = await sdk.wallet.balance(tokenContractAddress);
   *
   * ```
   */
  async balance(
    currencyAddress = NATIVE_TOKEN_ADDRESS,
  ): Promise<CurrencyValue> {
    const signer = this.connection.getSigner();
    invariant(signer, "Wallet not connected");
    let balance: BigNumber;
    if (isNativeToken(currencyAddress)) {
      balance = await signer.getBalance();
    } else {
      balance = await this.createErc20(currencyAddress).readContract.balanceOf(
        await this.address(),
      );
    }
    return await fetchCurrencyValue(
      this.connection.getProvider(),
      currencyAddress,
      balance,
    );
  }

  /**
   * Get the currently connected address
   * @example
   * ```javascript
   * const address = await sdk.wallet.address();
   * ```
   */
  async address(): Promise<string> {
    return await this.connectedWallet().getAddress();
  }

  /**
   * Sign any message with the connected wallet private key
   * @param message - the message to sign
   */
  async sign(message: string): Promise<string> {
    const signer = this.connectedWallet();
    return await signer.signMessage(message);
  }

  /**
   * Send a raw transaction to the blockchain from the connected wallet
   * @param transactionRequest
   */
  async sendRawTransaction(
    transactionRequest: TransactionRequest,
  ): Promise<TransactionResult> {
    const signer = this.connectedWallet();
    const tx = await signer.sendTransaction(transactionRequest);
    return {
      receipt: await tx.wait(),
    };
  }

  /** ***********************
   * PRIVATE FUNCTIONS
   * ***********************/

  private connectedWallet() {
    const signer = this.connection.getSigner();
    invariant(signer, "Wallet not connected");
    return signer;
  }

  private createErc20(currencyAddress: string) {
    return new ContractWrapper<IERC20>(
      this.connection.getSignerOrProvider(),
      currencyAddress,
      ERC20Abi,
      this.options,
    );
  }
}
