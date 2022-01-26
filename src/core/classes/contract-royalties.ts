import { IThirdwebNFT } from "@3rdweb/contracts";
import { BaseContract } from "@ethersproject/contracts";
import { CommonRoyaltySchema } from "../../schema/modules/common";
import { ContractMetadata, IGenericSchemaType } from "./contract-metadata";
import { ContractWrapper } from "./contract-wrapper";
import { z } from "zod";
import { IpfsStorage } from "./ipfs-storage";

export class ContractRoyalties<
  TContract extends BaseContract,
  TSchema extends IGenericSchemaType,
> {
  private contractWrapper;
  private metadata;
  private storage;

  constructor(
    contractWrapper: ContractWrapper<TContract>,
    metadata: ContractMetadata<TContract, TSchema>,
    storage: IpfsStorage,
  ) {
    this.contractWrapper = contractWrapper;
    this.metadata = metadata;
    this.storage = storage;
  }

  public async getRoyaltyInfo() {
    // parse it on the way out to make sure we default things if they are not set
    return CommonRoyaltySchema.parse({
      fee_recipient: await this.readContract().royaltyRecipient(),
      seller_fee_basis_points: await this.readContract().royaltyBps(),
    });
  }

  public async setRoyaltyInfo(
    royaltyData: z.input<typeof CommonRoyaltySchema>,
  ) {
    // read the metadata from the contract
    const oldMetadata = await this.metadata.get();

    // update the metadata with the new royalty data
    // if one of the keys is "undefined" it will be ignored (which is the desired behavior)
    const mergedMetadata = this.metadata.parseInputMetadata({
      ...oldMetadata,
      ...royaltyData,
    });
    // upload the new metadata to IPFS
    // why not use this.metadata.set()? - because that would end up sending it's own separate transaction to `setContractURI`
    // but we want to send both the `setRoyaltyInfo` and `setContractURI` in one transaction!
    const contractURI = await this.storage.uploadMetadata(mergedMetadata);

    // encode both the functions we want to send
    const encoded = [
      this.readContract().interface.encodeFunctionData("setRoyaltyInfo", [
        mergedMetadata.fee_recipient,
        mergedMetadata.seller_fee_basis_points,
      ]),
      this.readContract().interface.encodeFunctionData("setContractURI", [
        contractURI,
      ]),
    ];

    // actually send the transaction and return the receipt + a way to get the new royalty info
    return {
      transaction: await this.contractWrapper.sendTransaction("multicall", [
        encoded,
      ]),
      royaltyInfo: () => this.getRoyaltyInfo(),
    };
  }

  // FIXME hacky type bypass bacause of conflicting `contractName` between actual module contract and IThirdwebNFT contract
  // Should be able to turn off `contractName` generation from the ts contract wrapper generator
  private readContract() {
    return this.contractWrapper.readContract as unknown as IThirdwebNFT;
  }
}
