import { FEATURE_EDITION_CLAIMABLE } from "../../constants/erc1155-features";
import { CustomContractSchema } from "../../schema/contracts/custom";
import { BaseClaimConditionERC1155 } from "../../types/eips";
import { DetectableFeature } from "../interfaces/DetectableFeature";
import { IStorage } from "../interfaces/IStorage";
import { ContractMetadata } from "./contract-metadata";
import { ContractWrapper } from "./contract-wrapper";
import { DropErc1155ClaimConditions } from "./drop-erc1155-claim-conditions";
import { Erc1155 } from "./erc-1155";

export class Erc1155Claimable implements DetectableFeature {
  featureName = FEATURE_EDITION_CLAIMABLE.name;

  public conditions: DropErc1155ClaimConditions<BaseClaimConditionERC1155>;
  private contractWrapper: ContractWrapper<BaseClaimConditionERC1155>;
  private erc1155: Erc1155;
  private storage: IStorage;

  constructor(
    erc1155: Erc1155,
    contractWrapper: ContractWrapper<BaseClaimConditionERC1155>,
    storage: IStorage,
  ) {
    this.erc1155 = erc1155;
    this.contractWrapper = contractWrapper;

    this.storage = storage;
    const metadata = new ContractMetadata(
      this.contractWrapper,
      CustomContractSchema,
      this.storage,
    );
    this.conditions = new DropErc1155ClaimConditions(
      this.contractWrapper,
      metadata,
      this.storage,
    );
  }
}
