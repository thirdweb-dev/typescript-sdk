/**
 * Error that may get thrown if IPFS returns nothing for a given uri.
 * @public
 */
export class NotFoundError extends Error {
  /** @internal */
  constructor() {
    super("NOT_FOUND");
  }
}

/**
 * Error that may get thrown if an invalid address was passed
 * @public
 */
export class InvalidAddressError extends Error {
  /** @internal */
  constructor(address?: string) {
    super(
      address ? `'${address}' is an invalid address` : "Invalid address passed",
    );
  }
}

export class UploadError extends Error {
  /** @internal */
  constructor(message: string) {
    super(`UPLOAD_FAILED: ${message}`);
  }
}

export class NoTokenListed extends Error {
  /** @internal */
  constructor() {
    super(`LIST ERROR: you must list at least one token.`);
  }
}

export class NotOwner extends Error {
  /** @internal */
  constructor() {
    super(`LIST ERROR: you should be the owner of the token to list it.`);
  }
}

export class NotAuthorised extends Error {
  /** @internal */
  constructor() {
    super(
      `LIST ERROR: you do not have the permission to list in the marketplace`,
    );
  }
}
export class BuyLimit extends Error {
  /** @internal */
  constructor(message: string) {
    super(`BUY ERROR: You cannot buy more tgan ${message} tokens`);
  }
}

/**
 * Thrown when data fails to fetch from storage.
 */
export class FetchError extends Error {
  public innerError?: Error;

  /** @internal */
  constructor(message: string, innerError?: Error) {
    super(`FETCH_FAILED: ${message}`);
    this.innerError = innerError;
  }
}

/**
 * Thrown when attempting to create a snapshot with duplicate leafs
 */
export class DuplicateLeafsError extends Error {
  constructor(message?: string) {
    super(`DUPLICATE_LEAFS${message ? ` : ${message}` : ""}`);
  }
}
