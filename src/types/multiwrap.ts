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

export type TokensToWrap = {
  erc20Tokens?: ERC20Wrappable[];
  erc721Tokens?: ERC721Wrappable[];
  erc1155Tokens?: ERC1155Wrappable[];
};
