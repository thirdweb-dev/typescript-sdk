import { v4 as uuidv4 } from "uuid";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";

export function resolveOrGenerateId(requestUId: string | undefined): string {
  if (requestUId === undefined) {
    const buffer = Buffer.alloc(16);
    uuidv4({}, buffer);
    return hexlify(toUtf8Bytes(buffer.toString("hex")));
  } else {
    return hexlify(requestUId as string);
  }
}
