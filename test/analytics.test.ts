import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { NFTCollection } from "../src/contracts/nft-collection";
import { sdk, signers } from "./before-setup";

describe("ContractAnalytics", () => {
  type NewType = NFTCollection;
  let nftContract: NewType;
  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
    const address = await sdk.deployer.deployBuiltInContract(
      NFTCollection.contractType,
      {
        name: "NFT Contract",
        description: "Test NFT contract from tests",
        image:
          "https://pbs.twimg.com/profile_images/1433508973215367176/XBCfBn3g_400x400.jpg",
        primary_sale_recipient: adminWallet.address,
        seller_fee_basis_points: 1000,
        fee_recipient: AddressZero,
        platform_fee_basis_points: 10,
        platform_fee_recipient: AddressZero,
      },
    );
    nftContract = sdk.getNFTCollection(address);
  });

  it("should return different event types", async () => {
    await nftContract.mintToSelf({
      name: "Test1",
    });

    const events = await nftContract.analytics.query("TokensMinted");
    expect(events.length).to.be.equal(1);
  });
});
