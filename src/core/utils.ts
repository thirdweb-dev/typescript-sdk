import { Provider } from "@ethersproject/providers";
import invariant from "ts-invariant";
import type { ProviderOrSigner } from ".";
import { SupportedChainId } from "./constants";

export async function getChainIdByProviderOrSigner(
  providerOrSigner: ProviderOrSigner,
) {
  const networkProvider = Provider.isProvider(providerOrSigner)
    ? providerOrSigner
    : providerOrSigner.provider;

  invariant(networkProvider, "No network from provider");

  const network = await networkProvider?.getNetwork();
  invariant(network, "No network from signer");
  return network.chainId as SupportedChainId;
}
