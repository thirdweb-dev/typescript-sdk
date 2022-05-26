import {
  ContractEncoder,
  ContractEvents,
  ContractMetadata,
  ContractPlatformFee,
  ContractPrimarySale,
  ContractRoles,
  ContractRoyalty,
  Erc721,
  GasCostEstimator,
  IStorage,
  NetworkOrSignerOrProvider,
} from "../core";
import { SDKOptions, TokenErc721ContractSchema } from "../schema";
import {
  Multiwrap as MultiwrapContract,
  MultiwrapContract,
  SignatureDrop as SignatureDropContract,
} from "contracts";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { ITokenBundle } from "../../lib/Multiwrap";
import TokenStruct = ITokenBundle.TokenStruct;

/**
 * Multiwrap lets you wrap arbitrary ERC20, ERC721 and ERC1155 tokens you own into a single wrapped token / NFT.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * const sdk = new ThirdwebSDK("rinkeby");
 * const contract = sdk.getMultiwrap("{{contract_address}}");
 * ```
 *
 * @public
 */
export class Multiwrap extends Erc721<MultiwrapContract> {
  static contractType = "multiwrap" as const;
  static contractRoles = ["transfer", "minter", "unwrap", "asset"] as const;
  static contractAbi = require("../../abis/Multiwrap.json");

  /**
   * @internal
   */
  static schema = TokenErc721ContractSchema;

  public encoder: ContractEncoder<MultiwrapContract>;
  public estimator: GasCostEstimator<MultiwrapContract>;
  public metadata: ContractMetadata<MultiwrapContract, typeof Multiwrap.schema>;
  public events: ContractEvents<MultiwrapContract>;
  public roles: ContractRoles<
    MultiwrapContract,
    typeof Multiwrap.contractRoles[number]
  >;

  /**
   * Configure royalties
   * @remarks Set your own royalties for the entire contract or per token
   * @example
   * ```javascript
   * // royalties on the whole contract
   * contract.royalty.setDefaultRoyaltyInfo({
   *   seller_fee_basis_points: 100, // 1%
   *   fee_recipient: "0x..."
   * });
   * // override royalty for a particular token
   * contract.royalty.setTokenRoyaltyInfo(tokenId, {
   *   seller_fee_basis_points: 500, // 5%
   *   fee_recipient: "0x..."
   * });
   * ```
   */
  public royalty: ContractRoyalty<MultiwrapContract, typeof Multiwrap.schema>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<MultiwrapContract>(
      network,
      address,
      Multiwrap.contractAbi,
      options,
    ),
  ) {
    super(contractWrapper, storage, options);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      Multiwrap.schema,
      this.storage,
    );

    this.roles = new ContractRoles(
      this.contractWrapper,
      Multiwrap.contractRoles,
    );
    this.encoder = new ContractEncoder(this.contractWrapper);
    this.estimator = new GasCostEstimator(this.contractWrapper);
    this.events = new ContractEvents(this.contractWrapper);
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
  }

  public async wrap(
    tokens: TokenStruct,
    wrappedTokenUri: string
    recipient:
  )
}
