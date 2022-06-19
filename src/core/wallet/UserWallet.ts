import { RPCConnectionHandler } from "../classes/rpc-connection-handler";
import { ConnectionInfo, TransactionResult } from "../types";
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
import { BigNumber, providers, Signer } from "ethers";
import EventEmitter from "eventemitter3";

/**
 *
 * {@link UserWallet} events that you can subscribe to using `sdk.wallet.events`.
 *
 * @public
 */
export interface UserWalletEvents {
  /**
   * Emitted when `sdk.wallet.connect()` is called.
   */
  connected: [Signer];
  /**
   * Emitted when `sdk.wallet.disconnect()` is called.
   */
  disconnected: void;
}

/**
 * Connect and Interact with a user wallet
 * @example
 * ```javascript
 * const balance = await sdk.wallet.balance();
 * ```
 * @public
 */
export class UserWallet {
  private rpc: RPCConnectionHandler;
  private options: SDKOptions;

  public events = new EventEmitter<UserWalletEvents>();

  constructor(connection: ConnectionInfo, options: SDKOptions) {
    this.rpc = new RPCConnectionHandler(connection);
    this.options = options;
  }

  // TODO switchChain()
  // TODO event listener
  // TODO tokens()
  // TODO NFTs()

  connect(signer: Signer) {
    this.rpc.updateSigner(signer);
    this.events.emit("connected", signer);
  }

  disconnect() {
    this.rpc.updateSigner(undefined);
    this.events.emit("disconnected");
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
    const signer = this.requireWallet();
    const amountInWei = await normalizePriceValue(
      this.rpc.getProvider(),
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
    this.requireWallet();
    const provider = this.rpc.getProvider();
    let balance: BigNumber;
    if (isNativeToken(currencyAddress)) {
      balance = await provider.getBalance(await this.getAddress());
    } else {
      balance = await this.createErc20(currencyAddress).readContract.balanceOf(
        await this.getAddress(),
      );
    }
    return await fetchCurrencyValue(provider, currencyAddress, balance);
  }

  /**
   * Get the currently connected address
   * @example
   * ```javascript
   * const address = await sdk.wallet.getAddress();
   * ```
   */
  async getAddress(): Promise<string> {
    return await this.requireWallet().getAddress();
  }

  /**
   * Sign any message with the connected wallet private key
   * @param message - the message to sign
   */
  async sign(message: string): Promise<string> {
    const signer = this.requireWallet();
    return await signer.signMessage(message);
  }

  /**
   * Send a raw transaction to the blockchain from the connected wallet
   * @param transactionRequest - raw transaction data to send to the blockchain
   */
  async sendRawTransaction(
    transactionRequest: providers.TransactionRequest,
  ): Promise<TransactionResult> {
    const signer = this.requireWallet();
    const tx = await signer.sendTransaction(transactionRequest);
    return {
      receipt: await tx.wait(),
    };
  }

  /** ***********************
   * PRIVATE FUNCTIONS
   * ***********************/

  private requireWallet() {
    const signer = this.rpc.getSigner();
    invariant(
      signer,
      "This action requires a connected wallet. Please pass a valid signer to the SDK.",
    );
    return signer;
  }

  private createErc20(currencyAddress: string) {
    return new ContractWrapper<IERC20>(
      this.rpc.getConnectionInfo(),
      currencyAddress,
      ERC20Abi,
      this.options,
    );
  }
}
