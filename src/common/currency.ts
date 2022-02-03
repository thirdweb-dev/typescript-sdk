import { AddressZero } from "@ethersproject/constants";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { BigNumber, BigNumberish } from "ethers";
import {
  IERC20,
  IERC20__factory,
  TokenERC20__factory,
} from "@3rdweb/contracts";
import { ChainId, SUPPORTED_CHAIN_ID } from "../constants/chains";
import { NATIVE_TOKEN_ADDRESS, NATIVE_TOKENS } from "../constants/currency";
import { Signer } from "@ethersproject/abstract-signer";
import { Provider } from "@ethersproject/providers";
import { Currency, CurrencyValue, NativeToken } from "../types/currency";

export function isNativeToken(tokenAddress: string): boolean {
  return (
    tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS ||
    tokenAddress.toLowerCase() === AddressZero
  );
}

export async function approveErc20Allowance(
  contractToApprove: ContractWrapper<any>,
  currencyAddress: string,
  price: BigNumber,
  quantity: BigNumberish,
) {
  const signer = contractToApprove.getSigner();
  const provider = contractToApprove.getProvider();
  const erc20 = new ContractWrapper<IERC20>(
    signer || provider,
    currencyAddress,
    IERC20__factory.abi,
    {},
  );
  const owner = await contractToApprove.getSignerAddress();
  const spender = contractToApprove.readContract.address;
  const allowance = await erc20.readContract.allowance(owner, spender);
  const totalPrice = BigNumber.from(price).mul(BigNumber.from(quantity));
  if (allowance.lt(totalPrice)) {
    await erc20.sendTransaction("approve", [
      spender,
      allowance.add(totalPrice),
    ]);
  }
}

export async function fetchCurrencyMetadata(
  provider: Provider,
  asset: string,
): Promise<Currency> {
  try {
    if (isNativeToken(asset)) {
      const network = await provider.getNetwork();
      const nativeToken = getNativeTokenByChainId(network.chainId);
      return {
        name: nativeToken.name,
        symbol: nativeToken.symbol,
        decimals: nativeToken.decimals,
      };
    } else {
      const erc20 = TokenERC20__factory.connect(asset, provider);
      const [name, symbol, decimals] = await Promise.all([
        erc20.name(),
        erc20.symbol(),
        erc20.decimals(),
      ]);
      return {
        name,
        symbol,
        decimals,
      };
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return {
    name: "",
    symbol: "",
    decimals: 0,
  };
}

export async function fetchCurrencyValue(
  providerOrSigner: Provider,
  asset: string,
  price: BigNumberish,
): Promise<CurrencyValue> {
  const metadata = await getCurrencyMetadata(providerOrSigner, asset);
  return {
    ...metadata,
    value: price.toString(),
    displayValue: formatUnits(price, metadata.decimals),
  };
}

export function getNativeTokenByChainId(chainId: ChainId): NativeToken {
  return NATIVE_TOKENS[chainId as SUPPORTED_CHAIN_ID];
}
