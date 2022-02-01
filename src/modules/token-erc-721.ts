import { BigNumber } from "ethers";
import {
  NewSignaturePayload,
  SignaturePayload,
} from "../schema/modules/common/signature";
import { NFTMetadata, NFTMetadataInput } from "../schema/tokens/common";
import { UpdateableNetwork } from "../core/interfaces/module";
import { IStorage, NetworkOrSignerOrProvider } from "../core";
import { TokenErc721ModuleSchema } from "../schema/modules/token-erc721";
import { ContractWrapper } from "../core/classes/contract-wrapper";
import { TokenERC721, TokenERC721__factory } from "@3rdweb/contracts";
import { SDKOptions } from "../schema/sdk-options";
import { ContractMetadata } from "../core/classes/contract-metadata";
import { ContractRoles } from "../core/classes/contract-roles";
import { ContractRoyalty } from "../core/classes/contract-royalty";
import { Erc721 } from "../core/classes/erc-721";

/**
 * Create a collection of one-of-one NFTs.
 *
 * @example
 *
 * ```javascript
 * import { ThirdwebSDK } from "@3rdweb/sdk";
 *
 * // You can switch out this provider with any wallet or provider setup you like.
 * const provider = ethers.Wallet.createRandom();
 * const sdk = new ThirdwebSDK(provider);
 * const module = sdk.getNFTModule("{{module_address}}");
 * ```
 *
 * @public
 */
export class TokenErc721Module extends Erc721<TokenERC721> {
  static moduleType = "TokenERC721";
  static schema = TokenErc721ModuleSchema;
  static moduleRoles = ["admin", "minter", "transfer"] as const;

  public metadata: ContractMetadata<
    TokenERC721,
    typeof TokenErc721ModuleSchema
  >;
  public roles: ContractRoles<
    TokenERC721,
    typeof TokenErc721Module.moduleRoles[number]
  >;
  public royalty: ContractRoyalty<TokenERC721, typeof TokenErc721ModuleSchema>;

  constructor(
    network: NetworkOrSignerOrProvider,
    address: string,
    storage: IStorage,
    options: SDKOptions = {},
    contractWrapper = new ContractWrapper<TokenERC721>(
      network,
      address,
      TokenERC721__factory.abi,
      options,
    ),
  ) {
    super(contractWrapper, storage);
    this.metadata = new ContractMetadata(
      this.contractWrapper,
      TokenErc721ModuleSchema,
      this.storage,
    );
    this.roles = new ContractRoles(
      this.contractWrapper,
      TokenErc721Module.moduleRoles,
    );
    this.royalty = new ContractRoyalty(this.contractWrapper, this.metadata);
  }

  onNetworkUpdated(network: NetworkOrSignerOrProvider): void {
    this.contractWrapper.updateSignerOrProvider(network);
  }

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  public mint(metadata: NFTMetadataInput): Promise<NFTMetadata> {
    return Promise.resolve(undefined);
  }

  public mintBatch(metadatas: NFTMetadataInput[]): Promise<NFTMetadata[]> {
    return Promise.resolve([]);
  }

  public mintBatchTo(
    to: string,
    metadatas: NFTMetadataInput[],
  ): Promise<NFTMetadata[]> {
    return Promise.resolve([]);
  }

  public mintTo(to: string, metadata: NFTMetadataInput): Promise<NFTMetadata> {
    return Promise.resolve(undefined);
  }

  /** ******************************
   * SIGNATURE FUNCTIONS
   *******************************/

  public mintWithSignature(
    req: SignaturePayload,
    signature: string,
  ): Promise<BigNumber> {
    return Promise.resolve(undefined);
  }

  public verify(
    mintRequest: SignaturePayload,
    signature: string,
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  public generateSignature(
    mintRequest: NewSignaturePayload,
  ): Promise<{ payload: SignaturePayload; signature: string }> {
    return Promise.resolve({ payload: undefined, signature: "" });
  }

  public generateSignatureBatch(
    payloads: NewSignaturePayload[],
  ): Promise<{ payload: SignaturePayload; signature: string }[]> {
    return Promise.resolve([]);
  }
}
