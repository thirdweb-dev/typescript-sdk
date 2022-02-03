/**
 * Currency metadata.
 * @public
 */
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
  value: string;
  displayValue: string;
}
