import {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  Contract,
  ContractInterface,
  ContractTransaction,
  ethers,
} from "ethers";
import { RPCConnectionHandler } from "./rpc-connection-handler";
import { SDKOptions } from "../../schema/sdk-options";
import {
  ForwardRequestMessage,
  GaslessTransaction,
  NetworkOrSignerOrProvider,
  PermitRequestMessage,
} from "../types";
import { getGasPriceForChain } from "../../common/gas-price";
import { EventType } from "../../constants/events";
import {
  ExternalProvider,
  JsonRpcProvider,
  JsonRpcSigner,
  Log,
  TransactionReceipt,
  Web3Provider,
} from "@ethersproject/providers";
import invariant from "tiny-invariant";
import {
  BiconomyForwarderAbi,
  ForwardRequest,
  getAndIncrementNonce,
} from "../../common/forwarder";
import { Forwarder__factory } from "@3rdweb/contracts";
import {
  FORWARDER_ADDRESS,
  getContractAddressByChainId,
} from "../../constants/addresses";
import { signERC2612Permit } from "eth-permit";

export class ContractWrapper<
  TContract extends BaseContract,
> extends RPCConnectionHandler {
  private writeContract;
  public readContract;

  constructor(
    network: NetworkOrSignerOrProvider,
    contractAddress: string,
    contractAbi: ContractInterface,
    options: SDKOptions = {},
  ) {
    super(network, options);
    // set up the contract
    this.writeContract = new Contract(
      contractAddress,
      contractAbi,
      this.getSigner() || this.getProvider(),
    ) as TContract;
    // setup the read only contract
    this.readContract = this.options.readOnlyRpcUrl
      ? (this.writeContract.connect(
          ethers.getDefaultProvider(this.options.readOnlyRpcUrl),
        ) as TContract)
      : this.writeContract;
  }

  public override updateSignerOrProvider(
    network: NetworkOrSignerOrProvider,
  ): void {
    // update the underlyiyng base class
    super.updateSignerOrProvider(network);
    // re-connect the contract with the new signer / provider
    this.writeContract = this.writeContract.connect(
      this.getSigner() || this.getProvider(),
    ) as TContract;
    // setup the read only contract
    this.readContract = this.options.readOnlyRpcUrl
      ? (this.writeContract.connect(
          ethers.getDefaultProvider(this.options.readOnlyRpcUrl),
        ) as TContract)
      : this.writeContract;
  }

  /**
   * @internal
   */
  public async getChainID(): Promise<number> {
    const provider = this.getProvider();
    const { chainId } = await provider.getNetwork();
    return chainId;
  }
  /**
   * @internal
   */
  public async getSignerAddress(): Promise<string> {
    const signer = this.getSigner();
    if (!signer) {
      throw new Error("cannot get signer address without valid signer");
    }
    return await signer.getAddress();
  }

  /**
   * @internal
   */
  public async getCallOverrides(): Promise<CallOverrides> {
    const chainId = await this.getChainID();
    const speed = this.options.gasSettings?.speed || "fastest";
    const maxGasPrice = this.options.gasSettings?.maxPriceInGwei || 300;
    const gasPriceChain = await getGasPriceForChain(
      chainId,
      speed,
      maxGasPrice,
    );
    if (!gasPriceChain) {
      return {};
    }
    // TODO: support EIP-1559 by try-catch, provider.getFeeData();
    return {
      gasPrice: ethers.utils.parseUnits(gasPriceChain.toString(), "gwei"),
    };
  }

  /**
   * @internal
   */
  private async emitTransactionEvent(
    status: "submitted" | "completed",
    transactionHash: string,
  ) {
    this.emit(EventType.Transaction, {
      status,
      transactionHash,
    });
  }

  /**
   * @internal
   */
  public async sendTransaction(
    fn: string,
    args: any[],
    callOverrides?: CallOverrides,
  ): Promise<TransactionReceipt> {
    if (!callOverrides) {
      callOverrides = await this.getCallOverrides();
    }

    if (
      this.options?.gasless &&
      ("openzeppelin" in this.options.gasless ||
        "biconomy" in this.options.gasless)
    ) {
      const provider = this.getProvider();
      const txHash = await this.sendGaslessTransaction(fn, args, callOverrides);
      this.emitTransactionEvent("submitted", txHash);
      const receipt = await provider.waitForTransaction(txHash);
      this.emitTransactionEvent("completed", txHash);
      return receipt;
    } else {
      const tx = await this.sendTransactionByFunction(
        fn as keyof TContract["functions"],
        args,
        callOverrides,
      );
      this.emitTransactionEvent("submitted", tx.hash);
      const receipt = tx.wait();
      this.emitTransactionEvent("completed", tx.hash);
      return receipt;
    }
  }

  /**
   * @internal
   */
  private async sendTransactionByFunction(
    fn: keyof TContract["functions"],
    args: any[],
    callOverrides: CallOverrides,
  ): Promise<ContractTransaction> {
    const func: ethers.ContractFunction = (this.writeContract.functions as any)[
      fn
    ];
    if (!func) {
      throw new Error("invalid function");
    }
    return await func(...args, callOverrides);
  }

  /**
   * @internal
   */
  private async sendGaslessTransaction(
    fn: string,
    args: any[] = [],
    callOverrides: CallOverrides,
  ): Promise<string> {
    const signer = this.getSigner();
    invariant(
      signer,
      "Cannot execute gasless transaction without valid signer",
    );

    const chainId = await this.getChainID();
    const from = await this.getSignerAddress();
    const to = this.writeContract.address;
    const value = callOverrides?.value || 0;

    if (BigNumber.from(value).gt(0)) {
      throw new Error(
        "Cannot send native token value with gasless transaction",
      );
    }

    const data = this.writeContract.interface.encodeFunctionData(
      fn as any,
      args as any,
    );

    const gasEstimate = await (this.writeContract.estimateGas as any)[fn](
      ...args,
    );
    let gas = gasEstimate.mul(2);

    // in some cases WalletConnect doesn't properly gives an estimate for how much gas it would actually use.
    // it'd estimate ~21740 on polygon.
    // as a fix, we're setting it to a high arbitrary number (500k) as the gas limit that should cover for most function calls.
    if (gasEstimate.lt(25000)) {
      gas = BigNumber.from(500000);
    }

    const tx: GaslessTransaction = {
      from,
      to,
      data,
      chainId,
      gasLimit: gas,
      functionName: fn,
      functionArgs: args,
      callOverrides,
    };

    const txHash = await this.defaultGaslessSendFunction(tx);
    return txHash;
  }

  public async signTypedData(
    signer: ethers.Signer,
    from: string,
    domain: {
      name: string;
      version: string;
      chainId: number;
      verifyingContract: string;
    },
    types: any,
    message: any,
  ): Promise<BytesLike> {
    if (
      (
        (signer?.provider as Web3Provider)?.provider as ExternalProvider & {
          isWalletConnect?: boolean;
        }
      )?.isWalletConnect
    ) {
      const payload = ethers.utils._TypedDataEncoder.getPayload(
        domain,
        types,
        message,
      );
      return await (signer?.provider as JsonRpcProvider).send(
        "eth_signTypedData",
        [from.toLowerCase(), JSON.stringify(payload)],
      );
    } else {
      return await (signer as JsonRpcSigner)._signTypedData(
        domain,
        types,
        message,
      );
    }
  }

  public parseEventLogs(eventName: string, logs?: Log[]): any {
    if (!logs) {
      return null;
    }

    for (const log of logs) {
      try {
        const event = this.writeContract.interface.decodeEventLog(
          eventName,
          log.data,
          log.topics,
        );
        return event;
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    return null;
  }

  public parseLogs<T = any>(eventName: string, logs?: Log[]): T[] {
    if (!logs || logs.length === 0) {
      return [];
    }
    const topic = this.writeContract.interface.getEventTopic(eventName);
    const parsedLogs = logs.filter((x) => x.topics.indexOf(topic) >= 0);
    return parsedLogs.map(
      (l) => this.writeContract.interface.parseLog(l) as unknown as T,
    );
  }

  private async defaultGaslessSendFunction(
    transaction: GaslessTransaction,
  ): Promise<string> {
    if (this.options.gasless && "biconomy" in this.options.gasless) {
      return this.biconomySendFunction(transaction);
    }
    return this.defenderSendFunction(transaction);
  }

  private async biconomySendFunction(
    transaction: GaslessTransaction,
  ): Promise<string> {
    invariant(
      this.options.gasless && "biconomy" in this.options.gasless,
      "calling biconomySendFunction without biconomy",
    );
    const signer = this.getSigner();
    const provider = this.getProvider();
    invariant(signer && provider, "signer and provider must be set");

    const forwarder = new ethers.Contract(
      getContractAddressByChainId(
        transaction.chainId,
        "biconomyForwarder",
      ) as string,
      BiconomyForwarderAbi,
      provider,
    );
    const batchId = 0;
    const batchNonce = await getAndIncrementNonce(forwarder, "getNonce", [
      transaction.from,
      batchId,
    ]);

    const request = {
      from: transaction.from,
      to: transaction.to,
      token: ethers.constants.AddressZero,
      txGas: transaction.gasLimit.toNumber(),
      tokenGasPrice: "0",
      batchId,
      batchNonce: batchNonce.toNumber(),
      deadline: Math.floor(
        Date.now() / 1000 +
          ((this.options?.gasless &&
            "biconomy" in this.options.gasless &&
            this.options.gasless.biconomy?.deadlineSeconds) ||
            3600),
      ),
      data: transaction.data,
    };

    const hashToSign = ethers.utils.arrayify(
      ethers.utils.solidityKeccak256(
        [
          "address",
          "address",
          "address",
          "uint256",
          "uint256",
          "uint256",
          "uint256",
          "uint256",
          "bytes32",
        ],
        [
          request.from,
          request.to,
          request.token,
          request.txGas,
          request.tokenGasPrice,
          request.batchId,
          request.batchNonce,
          request.deadline,
          ethers.utils.keccak256(request.data),
        ],
      ),
    );

    const signature = await signer.signMessage(hashToSign);
    const response = await fetch(
      "https://api.biconomy.io/api/v2/meta-tx/native",
      {
        method: "POST",
        body: JSON.stringify({
          from: transaction.from,
          apiId: this.options.gasless.biconomy.apiId,
          params: [request, signature],
          to: transaction.to,
          gasLimit: transaction.gasLimit.toHexString(),
        }),
        headers: {
          "x-api-key": this.options.gasless.biconomy.apiKey,
          "Content-Type": "application/json;charset=utf-8",
        },
      },
    );

    if (response.ok) {
      const resp = await response.json();
      if (!resp.txHash) {
        throw new Error(`relay transaction failed: ${resp.log}`);
      }
      return resp.txHash;
    }
    throw new Error("relay transaction failed");
  }

  private async defenderSendFunction(
    transaction: GaslessTransaction,
  ): Promise<string> {
    invariant(
      this.options.gasless && "openzeppelin" in this.options.gasless,
      "calling biconomySendFunction without biconomy",
    );
    const signer = this.getSigner();
    const provider = this.getProvider();
    invariant(signer, "provider is not set");
    invariant(provider, "provider is not set");
    const forwarderAddress =
      this.options.gasless.openzeppelin.relayerForwarderAddress ||
      FORWARDER_ADDRESS;
    const forwarder = Forwarder__factory.connect(forwarderAddress, provider);
    const nonce = await getAndIncrementNonce(forwarder, "getNonce", [
      transaction.from,
    ]);
    const domain = {
      name: "GSNv2 Forwarder",
      version: "0.0.1",
      chainId: transaction.chainId,
      verifyingContract: forwarderAddress,
    };

    const types = {
      ForwardRequest,
    };

    let message: ForwardRequestMessage | PermitRequestMessage = {
      from: transaction.from,
      to: transaction.to,
      value: BigNumber.from(0).toString(),
      gas: BigNumber.from(transaction.gasLimit).toString(),
      nonce: BigNumber.from(nonce).toString(),
      data: transaction.data,
    };

    let signature: BytesLike;

    // if the executing function is "approve" and matches with erc20 approve signature
    // and if the token supports permit, then we use permit for gasless instead of approve.
    if (
      transaction.functionName === "approve" &&
      transaction.functionArgs.length === 2 &&
      this.writeContract.interface.functions["approve(address,uint256)"] &&
      this.writeContract.interface.functions[
        "permit(address,address,uint256,uint256,uint8,bytes32,bytes32)"
      ]
    ) {
      const spender = transaction.functionArgs[0];
      const amount = transaction.functionArgs[1];
      const permit = await signERC2612Permit(
        signer,
        this.writeContract.address,
        transaction.from,
        spender,
        amount,
      );
      message = { to: this.writeContract.address, ...permit };
      signature = `${permit.r}${permit.s.substring(2)}${permit.v.toString(16)}`;
    } else {
      // wallet connect special 🦋
      if (
        (
          (signer?.provider as Web3Provider)?.provider as ExternalProvider & {
            isWalletConnect?: boolean;
          }
        )?.isWalletConnect
      ) {
        const payload = ethers.utils._TypedDataEncoder.getPayload(
          domain,
          types,
          message,
        );
        signature = await (signer?.provider as JsonRpcProvider).send(
          "eth_signTypedData",
          [transaction.from.toLowerCase(), JSON.stringify(payload)],
        );
      } else {
        signature = await (signer as JsonRpcSigner)._signTypedData(
          domain,
          types,
          message,
        );
      }
    }

    let messageType = "forward";

    // if has owner property then it's permit :)
    if ((message as PermitRequestMessage)?.owner) {
      messageType = "permit";
    }

    const body = JSON.stringify({
      request: message,
      signature,
      type: messageType,
    });

    // console.log("POST", this.options.transactionRelayerUrl, body);
    const response = await fetch(this.options.gasless.openzeppelin.relayerUrl, {
      method: "POST",
      body,
    });
    if (response.ok) {
      const resp = await response.json();
      const result = JSON.parse(resp.result);
      return result.txHash;
    }
    throw new Error("relay transaction failed");
  }
}
