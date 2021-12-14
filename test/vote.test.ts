import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { VoteModule, CurrencyModule } from "../src";
import { appModule, sdk, signers } from "./before.test";

import { expect, assert } from "chai";
import { ethers } from "ethers";

global.fetch = require("node-fetch");

describe("Vote Module", async () => {
  let voteModule: VoteModule;
  let currencyModule: CurrencyModule;

  let adminWallet: SignerWithAddress,
    samWallet: SignerWithAddress,
    bobWallet: SignerWithAddress;

  before(() => {
    [adminWallet, samWallet, bobWallet] = signers;
  });

  beforeEach(async () => {
    sdk.setProviderOrSigner(adminWallet);

    currencyModule = await appModule.deployCurrencyModule({
      name: "DAOToken #1",
      symbol: "DAO1",
    });
    voteModule = await appModule.deployVoteModule({
      name: "DAO #1",

      // governance token address
      votingTokenAddress: currencyModule.address,

      // proposal start delay by block number. when can people start voting?
      votingDelay: 0,

      // porposal end time in number of block. 1 minute block (1 minutes * 60 seconds / 2 block per sec). when do people stop voting and can start executing? 30 = 1 minute in mumbai
      votingPeriod: 1,

      // quorum 1%, min 0%, max 100%
      votingQuorumFraction: 1,

      // requires 1 whole govtoken to be able to create a proposal
      proposalTokenThreshold: ethers.utils.parseUnits("1", 18).toString(),
    });

    // step 1: mint 1000 governance tokens to my wallet
    await currencyModule.mintTo(
      samWallet.address,
      ethers.utils.parseUnits("100", 18),
    );

    // step 35: later grant role to the vote contract, so the contract can mint more tokens
    // should be separate function since you need gov token to deploy vote module
    await currencyModule.grantRole("minter", voteModule.address);

    await sdk.setProviderOrSigner(samWallet);
    // step 2: delegate the governance token to someone for voting. in this case, myself.
    await currencyModule.contract.delegate(samWallet.address);
  });

  it("should permit a proposal to be passed if it receives the right votes", async () => {
    await sdk.setProviderOrSigner(samWallet);
    const proposalId = await voteModule.propose("Mint Tokens", [
      {
        to: currencyModule.address,
        value: 0,
        data: currencyModule.contract.interface.encodeFunctionData("mint", [
          bobWallet.address,
          ethers.utils.parseUnits("1", 18),
        ]),
      },
    ]);

    assert.equal(
      proposalId.toString(),
      "104170210022127651775423883212592560005122769612892251008246414347470807652072",
    );

    await voteModule.vote(
      proposalId.toString(),

      // 0 = Against, 1 = For, 2 = Abstain
      1,

      // optional reason, be mindful more character count = more gas.
      "Reason + Gas :)",
    );

    // Step 3: Execute the proposal if it is expired and passed
    await voteModule.execute(proposalId.toString());

    const balanceOfBobsWallet = await currencyModule.balanceOf(
      bobWallet.address,
    );

    assert.equal(balanceOfBobsWallet.displayValue, "1.0");
  });
});
