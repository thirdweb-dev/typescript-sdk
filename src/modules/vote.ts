import {
  ERC20__factory,
  VotingGovernor,
  VotingGovernor__factory,
} from "@3rdweb/contracts";
import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish, BytesLike, ethers } from "ethers";
import {
  Currency,
  CurrencyValue,
  getCurrencyMetadata,
  getCurrencyValue,
  ModuleType,
} from "../common";
import { Module } from "../core/module";
import { MetadataURIOrObject } from "../core/types";

export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export enum ProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed,
}

export interface ProposalVote {
  type: VoteType;
  label: string;
  count: BigNumber;
}

export interface ProposalExecution {
  to: string;
  value: BigNumberish;
  data: BytesLike;
}

export interface Proposal {
  proposalId: string;
  proposer: string;
  description: string;
  startBlock: BigNumber;
  endBlock: BigNumber;
  state: ProposalState;
  votes: ProposalVote[];
  executions: ProposalExecution[];
}

export interface VoteSettings {
  votingDelay: string;
  votingPeriod: string;
  votingTokenAddress: string;
  votingTokenMetadata: Currency;
  votingQuorumFraction: string;
  proposalTokenThreshold: string;
}

/**
 *
 * Access this module by calling {@link ThirdwebSDK.getVoteModule}
 * @public
 */
export class VoteModule extends Module<VotingGovernor> {
  public static moduleType: ModuleType = ModuleType.VOTE as const;

  /**
   * @internal
   */
  protected connectContract(): VotingGovernor {
    return VotingGovernor__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return VoteModule.moduleType;
  }

  public async settings(): Promise<VoteSettings> {
    const [
      votingDelay,
      votingPeriod,
      votingTokenAddress,
      votingQuorumFraction,
      proposalTokenThreshold,
    ] = await Promise.all([
      this.readOnlyContract.votingDelay(),
      this.readOnlyContract.votingPeriod(),
      this.readOnlyContract.token(),
      this.readOnlyContract.quorumNumerator(),
      this.readOnlyContract.proposalThreshold(),
    ]);
    const votingTokenMetadata = await getCurrencyMetadata(
      this.providerOrSigner,
      votingTokenAddress,
    );
    return {
      votingDelay: votingDelay.toString(),
      votingPeriod: votingPeriod.toString(),
      votingTokenAddress,
      votingTokenMetadata,
      votingQuorumFraction: votingQuorumFraction.toString(),
      proposalTokenThreshold: proposalTokenThreshold.toString(),
    };
  }

  public async get(proposalId: string): Promise<Proposal> {
    // early error out if proposal doesn't exist
    await this.readOnlyContract.state(proposalId);
    const all = await this.getAll();
    const proposals = all.filter(
      (p) => p.proposalId.toLowerCase() === proposalId.toLowerCase(),
    );
    if (proposals.length === 0) {
      throw new Error("proposal not found");
    }
    return proposals[0];
  }

  public async getAll(): Promise<Proposal[]> {
    const proposals = await this.readOnlyContract.queryFilter(
      this.contract.filters.ProposalCreated(),
    );

    const results = [];
    const states = await Promise.all(
      proposals.map((p) => this.readOnlyContract.state(p.args.proposalId)),
    );
    const votes = await Promise.all(
      proposals.map((p) =>
        this.readOnlyContract.proposalVotes(p.args.proposalId),
      ),
    );

    for (let i = 0; i < proposals.length; i++) {
      const p = proposals[i].args;
      const s = states[i];
      const v = [
        {
          type: VoteType.Against,
          label: "Against",
          count: votes[i].againstVotes,
        },
        {
          type: VoteType.For,
          label: "For",
          count: votes[i].forVotes,
        },
        {
          type: VoteType.Abstain,
          label: "Abstain",
          count: votes[i].abstainVotes,
        },
      ];
      const e = [];
      for (let j = 0; j < p.targets.length; j++) {
        e.push({
          to: p.targets[j],
          value: p.values[j] || 0,
          data: p.calldatas[j],
        });
      }
      results.push({
        proposalId: p.proposalId.toString(),
        proposer: p.proposer,
        description: p.description,
        startBlock: p.startBlock,
        endBlock: p.endBlock,
        state: s,
        votes: v,
        executions: e,
      });
    }

    return results;
  }

  public async propose(description: string, executions: ProposalExecution[]) {
    const tos = executions.map((p) => p.to);
    const values = executions.map((p) => p.value);
    const datas = executions.map((p) => p.data);
    await this.sendTransaction("propose", [tos, values, datas, description]);
  }

  public async vote(proposalId: string, voteType: VoteType, reason = "") {
    await this.sendTransaction("castVoteWithReason", [
      proposalId,
      voteType,
      reason,
    ]);
  }

  public async execute(proposalId: string) {
    const proposal = await this.get(proposalId);
    const tos = proposal.executions.map((p) => p.to);
    const values = proposal.executions.map((p) => p.value);
    const datas = proposal.executions.map((p) => p.data);
    const descriptionHash = ethers.utils.id(proposal.description);
    await this.sendTransaction("execute", [
      tos,
      values,
      datas,
      descriptionHash,
    ]);
  }

  public async canExecute(proposalId: string): Promise<boolean> {
    const proposal = await this.get(proposalId);
    const tos = proposal.executions.map((p) => p.to);
    const values = proposal.executions.map((p) => p.value);
    const datas = proposal.executions.map((p) => p.data);
    const descriptionHash = ethers.utils.id(proposal.description);
    try {
      await this.readOnlyContract.callStatic.execute(
        tos,
        values,
        datas,
        descriptionHash,
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check the balance of the project wallet in the native token of the chain
   *
   * @returns - The balance of the project in the native token of the chain
   */
  public async balance(): Promise<CurrencyValue> {
    const balance = await this.readOnlyContract.provider.getBalance(
      this.address,
    );
    return {
      name: "",
      symbol: "",
      decimals: 18,
      value: balance.toString(),
      displayValue: ethers.utils.formatUnits(balance, 18),
    };
  }

  /**
   * Check the balance of the project wallet in a particular
   * ERC20 token contract
   *
   * @returns - The balance of the project in the native token of the chain
   */
  public async balanceOfToken(tokenAddress: string): Promise<CurrencyValue> {
    const erc20 = ERC20__factory.connect(
      tokenAddress,
      this.readOnlyContract.provider,
    );
    return await getCurrencyValue(
      this.providerOrSigner,
      tokenAddress,
      await erc20.balanceOf(this.address),
    );
  }

  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await this.sdk.getStorage().uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }
}
