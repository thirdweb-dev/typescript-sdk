import { IBurnableERC20 } from "contracts/IBurnableERC20";
import { FEATURE_TOKEN_BURNABLE } from "../../constants/erc20-features";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { ContractWrapper } from "./contract-wrapper";

export class Erc20Burnable implements DetectableFeature {
  featureName = FEATURE_TOKEN_BURNABLE.name;

  private contractWrapper: ContractWrapper<IBurnableERC20>;

  constructor(contractWrapper: ContractWrapper<IBurnableERC20>) {
    this.contractWrapper = contractWrapper;
  }
}
