import { AddressZero } from "@ethersproject/constants";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { BigNumber, BigNumberish, ethers } from "ethers";
import {
  IERC20,
  IERC20__factory,
  TokenERC20,
  TokenERC20__factory,
} from "@3rdweb/contracts";
import { ChainId, SUPPORTED_CHAIN_ID } from "../constants/chains";
import { NATIVE_TOKEN_ADDRESS, NATIVE_TOKENS } from "../constants/currency";
import { Provider } from "@ethersproject/providers";
import { formatUnits } from "ethers/lib/utils";
import { Currency, CurrencyValue, NativeToken, Price } from "../types/currency";

export function isNativeToken(tokenAddress: string): boolean {
  return (
    tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS ||
    tokenAddress.toLowerCase() === AddressZero
  );
}

export async function normalizePriceValue(
  provider: Provider,
  inputPrice: Price,
  currencyAddress: string,
) {
  const metadata = await fetchCurrencyMetadata(provider, currencyAddress);
  return ethers.utils.parseUnits(
    BigNumber.from(inputPrice).toString(),
    metadata.decimals,
  );
}

export async function fetchCurrencyMetadata(
  provider: Provider,
  asset: string,
): Promise<Currency> {
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
}

export async function fetchCurrencyValue(
  providerOrSigner: Provider,
  asset: string,
  price: BigNumberish,
): Promise<CurrencyValue> {
  const metadata = await fetchCurrencyMetadata(providerOrSigner, asset);
  return {
    ...metadata,
    value: BigNumber.from(price),
    displayValue: formatUnits(price, metadata.decimals),
  };
}

export function getNativeTokenByChainId(chainId: ChainId): NativeToken {
  return NATIVE_TOKENS[chainId as SUPPORTED_CHAIN_ID];
}

export async function setErc20Allowance(
  contractToApprove: ContractWrapper<any>,
  value: BigNumber,
  currencyAddress: string,
  overrides: any,
): Promise<any> {
  if (isNativeToken(currencyAddress)) {
    overrides["value"] = value;
  } else {
    const signer = contractToApprove.getSigner();
    const provider = contractToApprove.getProvider();
    const erc20 = new ContractWrapper<TokenERC20>(
      signer || provider,
      currencyAddress,
      TokenERC20__factory.abi,
      {},
    );

    const owner = await contractToApprove.getSignerAddress();
    const spender = contractToApprove.readContract.address;
    const allowance = await erc20.readContract.allowance(owner, spender);
    if (allowance.lt(value)) {
      await erc20.sendTransaction("increaseAllowance", [
        spender,
        value.sub(allowance),
      ]);
    }
    return overrides;
  }
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
