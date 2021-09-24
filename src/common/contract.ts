import { Contract } from "@ethersproject/contracts";
import { ProviderOrSigner } from "../core/types";
import { replaceIpfsWithGateway } from "./ipfs";

export interface ContractMetadata {
  uri: string;
  name?: string;
  description?: string;
  image?: string;
  external_link?: string;
  seller_fee_basis_points?: number;
  fee_recipient?: string;
}

const contractUriABI = [
  {
    inputs: [],
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
