import { IThirdwebRoyalty } from "@3rdweb/contracts";
import { CommonRoyaltySchema } from "../../schema/contracts/common";
import { ContractMetadata, IGenericSchemaType } from "./contract-metadata";
import { ContractWrapper } from "./contract-wrapper";
import { z } from "zod";
import { TransactionResultPromise } from "../types";

// TODO: hide zod implementation from this class with nice types
export class ContractRoyalty<
  TContract extends IThirdwebRoyalty,
  TSchema extends IGenericSchemaType,
> {
  private contractWrapper;
  private metadata;

  constructor(
    contractWrapper: ContractWrapper<TContract>,
    metadata: ContractMetadata<TContract, TSchema>,
  ) {
    this.contractWrapper = contractWrapper;
    this.metadata = metadata;
  }

  public async getRoyaltyInfo() {
    const [royaltyRecipient, royaltyBps] =
      await this.contractWrapper.readContract.getRoyaltyInfo();
    // parse it on the way out to make sure we default things if they are not set
    return CommonRoyaltySchema.parse({
      fee_recipient: royaltyRecipient,
      seller_fee_basis_points: royaltyBps,
    });
  }

  public async setRoyaltyInfo(
    royaltyData: z.input<typeof CommonRoyaltySchema>,
  ): TransactionResultPromise<z.output<typeof CommonRoyaltySchema>> {
    // read the metadata from the contract
    const oldMetadata = await this.metadata.get();

    // update the metadata with the new royalty data
    // if one of the keys is "undefined" it will be ignored (which is the desired behavior)
    const mergedMetadata = this.metadata.parseInputMetadata({
      ...oldMetadata,
      ...royaltyData,
    });

    // why not use this.metadata.set()? - because that would end up sending it's own separate transaction to `setContractURI`
    // but we want to send both the `setRoyaltyInfo` and `setContractURI` in one transaction!
    const contractURI = await this.metadata._parseAndUploadMetadata(
      mergedMetadata,
    );

    // encode both the functions we want to send
    const encoded = [
      this.contractWrapper.readContract.interface.encodeFunctionData(
        "setRoyaltyInfo",
        [mergedMetadata.fee_recipient, mergedMetadata.seller_fee_basis_points],
      ),
      this.contractWrapper.readContract.interface.encodeFunctionData(
        "setContractURI",
        [contractURI],
      ),
    ];

    // actually send the transaction and return the receipt + a way to get the new royalty info
    return {
      receipt: await this.contractWrapper.multiCall(encoded),
      data: () => this.getRoyaltyInfo(),
    };
  }
}
