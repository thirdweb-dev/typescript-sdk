import { Amount } from "./currency";
import { BigNumberish } from "ethers";

export type ERC20Wrappable = {
  contractAddress: string;
  tokenAmount: Amount;
};

export type ERC721Wrappable = {
  contractAddress: string;
  tokenId: BigNumberish;
};

export type ERC1155Wrappable = {
  contractAddress: string;
  tokenAmount: Amount;
  tokenId: BigNumberish;
};
