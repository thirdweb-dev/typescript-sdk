const genericMessage = "Invariant Violation";

const {
  setPrototypeOf = function (obj: any, proto: any) {
    obj.__proto__ = proto;
    return obj;
  },
} = Object as any;

/**
 * @internal
 */
export class InvariantError extends Error {
  framesToPop = 1;
  name = genericMessage;
  constructor(message: string = genericMessage) {
    super(
      typeof message === "number"
        ? `${genericMessage}: ${message} (see https://github.com/apollographql/invariant-packages)`
        : message,
    );
    setPrototypeOf(this, InvariantError.prototype);
  }
}
/**
 * @internal
 * @param condition - any truthy condition to assert
 * @param message  - optional message to use if the condition is falsy
 */
export function invariant(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
