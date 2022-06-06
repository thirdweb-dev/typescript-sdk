import { IDrop } from "contracts/IDrop";
import { FEATURE_NFT_CLAIMABLE } from "../../constants/erc721-features";
import { BaseERC721 } from "../../types/eips";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { ContractWrapper } from "./contract-wrapper";
import { Erc721 } from "./erc-721";

export class Erc721Claimable implements DetectableFeature {
  featureName = FEATURE_NFT_CLAIMABLE.name;
  private contractWrapper: ContractWrapper<BaseERC721 & IDrop>;
  private erc721: Erc721;

  constructor(
    erc721: Erc721,
    contractWrapper: ContractWrapper<BaseERC721 & IDrop>,
  ) {
    this.erc721 = erc721;
    this.contractWrapper = contractWrapper;
  }
}
