import { ContractWrapper } from "../core/classes/contract-wrapper";
import {
  BigNumber,
  BigNumberish,
  Contract,
  ethers,
  constants,
  providers,
} from "ethers";
import {
  getNativeTokenByChainId,
  NATIVE_TOKEN_ADDRESS,
} from "../constants/currency";

import { formatUnits } from "ethers/lib/utils";
import { Amount, Currency, CurrencyValue, Price } from "../types/currency";
import { PriceSchema } from "../schema/shared";
import ERC20Abi from "../../abis/IERC20.json";
import ERC20MetadataAbi from "../../abis/IERC20Metadata.json";
import { BaseERC20 } from "../types/eips";
import { IERC20, IERC20Metadata } from "contracts";

export function isNativeToken(tokenAddress: string): boolean {
  return (
    tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS ||
    tokenAddress.toLowerCase() === constants.AddressZero
  );
}

export async function normalizePriceValue(
  provider: providers.Provider,
  inputPrice: Price,
  currencyAddress: string,
) {
  const metadata = await fetchCurrencyMetadata(provider, currencyAddress);
  return ethers.utils.parseUnits(
    PriceSchema.parse(inputPrice),
    metadata.decimals,
  );
}

export async function fetchCurrencyMetadata(
  provider: providers.Provider,
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
    const erc20 = new Contract(
      asset,
      ERC20MetadataAbi,
      provider,
    ) as IERC20Metadata;
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
  providerOrSigner: providers.Provider,
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
    const erc20 = new ContractWrapper<IERC20>(
      signer || provider,
      currencyAddress,
      ERC20Abi,
      {},
    );

    const owner = await contractToApprove.getSignerAddress();
    const spender = contractToApprove.readContract.address;
    const allowance = await erc20.readContract.allowance(owner, spender);
    if (allowance.lt(value)) {
      // approve overrides the previous allowance, set it to the minimum required for this tx
      await erc20.sendTransaction("approve", [spender, value]);
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
    ERC20Abi,
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

export async function normalizeAmount(
  contractWrapper: ContractWrapper<BaseERC20>,
  amount: Amount,
): Promise<BigNumber> {
  const decimals = await contractWrapper.readContract.decimals();
  return ethers.utils.parseUnits(PriceSchema.parse(amount), decimals);
}
