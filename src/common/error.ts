/**
 * Error that may get thrown if IPFS returns nothing for a given uri.
 * @public
 */
export class NotFoundError extends Error {
  constructor() {
    super("NOT_FOUND");
  }
}
