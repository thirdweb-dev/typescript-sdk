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

export class UploadError extends Error {
  /** @internal */
  constructor(message: string) {
    super(`UPLOAD_FAILED: ${message}`);
  }
}
