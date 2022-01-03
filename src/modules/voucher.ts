import { IVoucher } from "../interfaces/modules";
import { SignatureMint721, SignatureMint721__factory } from "@3rdweb/contracts";
import { TransactionReceipt } from "@ethersproject/providers";
import { ModuleType } from "../common";
import { Module } from "../core/module";
import { MetadataURIOrObject } from "../core/types";

/**
 * Access this module by calling {@link ThirdwebSDK.getVoucherModule}
 *
 * @alpha
 * @public
 */
export class VoucherModule
  extends Module<SignatureMint721>
  implements IVoucher
{
  public static moduleType: ModuleType = ModuleType.VOUCHER as const;

  /**
   * @internal
   */
  protected connectContract(): SignatureMint721 {
    return SignatureMint721__factory.connect(
      this.address,
      this.providerOrSigner,
    );
  }

  /**
   * @internal
   */
  protected getModuleType(): ModuleType {
    return VoucherModule.moduleType;
  }

  public async setModuleMetadata(
    metadata: MetadataURIOrObject,
  ): Promise<TransactionReceipt> {
    const uri = await this.sdk.getStorage().uploadMetadata(metadata);
    return await this.sendTransaction("setContractURI", [uri]);
  }
}
