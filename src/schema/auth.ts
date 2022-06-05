import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { AddressSchema, RawDateSchema } from "./shared";

/**
 * @internal
 */
export const AuthenticationPayloadInputSchema = z.object({
  /**
   * The application to authenticate to
   */
  application: z.string(),
  /**
   * The address of the wallet requesting to authenticate
   */
  subject: AddressSchema,
  /**
   * The endpoints intended to receive the authentication payload
   */
  endpoints: z.array(z.string()).optional(),
  /**
   * The date before which the authentication payload is invalid
   */
  invalidBefore: z.date().optional(),
  /**
   * The date after which the authentication payload is invalid
   */
  expiresAt: z.date().optional(),
});

/**
 * @internal
 */
export const AuthenticationPayloadOutputSchema = z.object({
  /**
   * The address of the wallet issuing the payload
   */
  iss: z.string(),
  /**
   * The address of the wallet requesting to authenticate
   */
  sub: z.string(),
  /**
   * The audience of endpoints intended to receive the authentication payload
   */
  aud: z.array(z.string()).default(["*"]),
  /**
   * The date before which the authentication payload is invalid
   */
  exp: RawDateSchema.transform((b) => b.toNumber()).default(
    new Date(Date.now() + 1000 * 60 * 60 * 5),
  ),
  /**
   * The date after which the authentication payload is invalid
   */
  nbf: RawDateSchema.transform((b) => b.toNumber()).default(new Date()),
  /**
   * The date on which the payload was issued
   */
  iat: RawDateSchema.transform((b) => b.toNumber()).default(new Date()),
  /**
   * The unique identifier of the payload
   */
  jti: z.string().default(uuidv4()),
});

/**
 * @internal
 */
export const AuthenticationPayloadSchema = z.object({
  iss: z.string(),
  sub: z.string(),
  aud: z.array(z.string()),
  exp: z.number(),
  nbf: z.number(),
  iat: z.number(),
  jti: z.string(),
});

/**
 * @internal
 */
export const AuthorizedPayloadSchema = z.object({
  payload: AuthenticationPayloadSchema,
  authorizedPayload: z.string(),
});

export const AuthenticatedPayloadSchema = AuthorizedPayloadSchema.extend({
  authenticatedPayload: z.string(),
});

/**
 * Input model to create a new signed authentication payload
 * @public
 */
export type AuthenticationPayloadInput = z.input<
  typeof AuthenticationPayloadInputSchema
>;

/**
 * @public
 */
export type FilledAuthenticationPayloadInput = z.output<
  typeof AuthenticationPayloadInputSchema
>;

/**
 * @public
 */
export type AuthenticationPayloadOutput = z.output<
  typeof AuthenticationPayloadOutputSchema
>;

/**
 * @public
 */
export type AuthenticationPayload = z.output<
  typeof AuthenticationPayloadSchema
>;

/**
 * Authentication payload with signature used to authenticate a wallet
 * @public
 */
export type AuthorizedPayload = z.output<typeof AuthorizedPayloadSchema>;

/**
 * @public
 */
export type AuthenticatedPayload = z.output<typeof AuthenticatedPayloadSchema>;
