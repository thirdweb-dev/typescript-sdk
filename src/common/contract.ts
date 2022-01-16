import { arrayify } from "@ethersproject/bytes";
import { Contract } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import { ProviderOrSigner } from "../core/types";
import { ContractMetadataSchema } from "../types";
import { replaceIpfsWithGateway, recursiveResolveGatewayUrl } from "./ipfs";
/**
 * @internal
 */
export const InterfaceId_IERC721 = arrayify("0x80ac58cd");

/**
 * @internal
 */
export const InterfaceId_IERC1155 = arrayify("0xd9b67a26");

const contractUriABI = [
  {
    inputs: [] as [],
    name: "contractURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

/**
 * @internal
 */
export async function getContractMetadata<
  TMetadataType extends ContractMetadataSchema,
>(
  provider: ProviderOrSigner,
  address: string,
  ipfsGatewayUrl: string,
  resolveGateway = false,
) {
  const contract = new Contract(address, contractUriABI, provider);
  const uri = await contract.contractURI();
  const gatewayUrl = replaceIpfsWithGateway(uri, ipfsGatewayUrl);
  const meta = await fetch(gatewayUrl);

  if (!meta.ok) {
    throw new Error(
      `Gateway did not return metadata, instead returned:\n ${meta.status} - ${meta.statusText}`,
    );
  }

  try {
    let json = await meta.json();
    if (resolveGateway) {
      json = recursiveResolveGatewayUrl(json, ipfsGatewayUrl);
    }
    const entity: TMetadataType = {
      ...json,
    };
    return entity;
  } catch (e) {
    throw new Error(
      `Gateway did not return metadata, instead returned:\n ${meta.status} - ${meta.statusText}`,
    );
  }
}

/**
 * @internal
 */
export async function isContract(
  provider: Provider,
  address: string,
): Promise<boolean> {
  return (await provider.getCode(address)) !== "0x";
}
