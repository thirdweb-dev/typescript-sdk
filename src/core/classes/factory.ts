/* eslint-disable line-comment-position */
import {
  DropERC721__factory,
  TWFactory,
  TWFactory__factory,
} from "@3rdweb/contracts";
import { ethers } from "ethers";
import { z } from "zod";
import { MODULES_MAP } from "../../modules";
import { SDKOptions } from "../../schema/sdk-options";
import { IStorage } from "../interfaces/IStorage";
import { NetworkOrSignerOrProvider, ValidModuleClass } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { ProxyDeployedEvent } from "@3rdweb/contracts/dist/TWFactory";

export class ModuleFactory extends ContractWrapper<TWFactory> {
  private storage: IStorage;

  constructor(
    network: NetworkOrSignerOrProvider,
    storage: IStorage,
    options?: SDKOptions,
  ) {
    super(
      network,
      options?.thirdwebModuleFactory as string,
      TWFactory__factory.abi,
      options,
    );
    this.storage = storage;
  }

  public async deploy<TModule extends ValidModuleClass>(
    moduleType: TModule["moduleType"],
    moduleMetadata: z.input<TModule["schema"]["deploy"]>,
  ) {
    const metadata =
      MODULES_MAP[moduleType].schema.deploy.parse(moduleMetadata);

    // TODO: is there any special pre-processing we need to do before uploading?
    const contractURI = await this.storage.uploadMetadata(
      metadata,
      this.readContract.address,
      await this.getSigner()?.getAddress(),
    );
    console.debug("getModuleAddresses", moduleType, contractURI);

    const encodedFunc = DropERC721__factory.getInterface(
      DropERC721__factory.abi,
    ).encodeFunctionData("initialize", [
      metadata.name,
      "SYMBOL", // TODO: make this configurable in metadata,
      contractURI,
      "0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81", // TODO: dont hardcode trusted forwarder
      await this.getSignerAddress(), // TODO: Who should this be?
      metadata.fee_recipient,
      metadata.seller_fee_basis_points,
      metadata.platform_fee_basis_points,
      metadata.platform_fee_recipient,
    ]);

    const encodedType = ethers.utils.formatBytes32String(moduleType);
    console.log("moduleType", moduleType, encodedType);
    const receipt = await this.sendTransaction("deployProxy", [
      encodedType,
      encodedFunc,
    ]);

    const events = await this.parseLogs<ProxyDeployedEvent>(
      "ProxyDeployed",
      receipt.logs,
    );
    if (events.length < 1) {
      throw new Error("No ProxyDeployed event found");
    }

    const proxyAddress = events[0].args.proxy;
    return proxyAddress;
  }
}
