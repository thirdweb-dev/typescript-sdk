import { AddressZero } from "@ethersproject/constants";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { BigNumber, BigNumberish } from "ethers";
import { IERC20, IERC20__factory } from "@3rdweb/contracts";

export const NATIVE_TOKEN_ADDRESS =
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

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
