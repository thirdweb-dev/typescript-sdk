import { z } from "zod";
import { AirdropAddressInput } from "../../schema/contracts/common/airdrop";

/**
 * Input model to pass a list of addresses + amount to transfer to each one
 * @public
 */
export type AirdropInput = z.input<typeof AirdropAddressInput>;
