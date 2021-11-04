import { arrayify } from "@ethersproject/bytes";
import { Contract } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import { ProviderOrSigner } from "../core/types";
import { replaceIpfsWithGateway } from "./ipfs";

/**
 * The typical contract metadata found on the modules.
 * @public
 */
export interface ContractMetadata {
  uri: string;
  name?: string;
  description?: string;
  image?: string;
  external_link?: string;
  seller_fee_basis_points?: number;
  fee_recipient?: string;
}

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
export async function getContractMetadata(
  provider: ProviderOrSigner,
  address: string,
  ipfsGatewayUrl: string,
): Promise<ContractMetadata> {
  const contract = new Contract(address, contractUriABI, provider);
  const uri = await contract.contractURI();
  const gatewayUrl = replaceIpfsWithGateway(uri, ipfsGatewayUrl);
  const meta = await fetch(gatewayUrl);
  const metadata = await meta.json();
  const entity: ContractMetadata = {
    ...metadata,
    uri,
    image: replaceIpfsWithGateway(metadata.image, ipfsGatewayUrl),
  };
  return entity;
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
