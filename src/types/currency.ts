/**
 * Currency metadata.
 * @public
 */
import { BigNumber } from "ethers";
import { z } from "zod";
import { PriceSchema } from "../schema/shared";

export interface Currency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface NativeToken extends Currency {
  wrapped: {
    address: string;
    name: string;
    symbol: string;
  };
}

/**
 * Currency metadata & value.
 * @public
 */
export interface CurrencyValue extends Currency {
  value: BigNumber;
  displayValue: string;
}

/**
 * Represents a currency price already formatted. ie. "1" for 1 ether.
 */
export type Price = z.input<typeof PriceSchema>;
