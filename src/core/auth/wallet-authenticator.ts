import { ethers } from "ethers";
import { SDKOptions } from "../../schema";
import {
  AuthenticatedPayload,
  AuthenticatedPayloadSchema,
  AuthenticationPayloadInput,
  AuthenticationPayloadInputSchema,
  AuthenticationPayloadOutput,
  AuthenticationPayloadOutputSchema,
  AuthorizedPayload,
  AuthorizedPayloadSchema,
  FilledAuthenticationPayloadInput,
} from "../../schema/auth";
import { RPCConnectionHandler } from "../classes/rpc-connection-handler";
import { NetworkOrSignerOrProvider } from "../types";

/**
 * Wallet Authenticator
 * @remarks Enables the connected wallet to securely authenticate to a backend server.
 * The wallet authenticator makes use of a JSON token to authenticate the wallet that
 * contains an embedded JWT token. The authentication token can be reused multiple times
 * after authenticating and doesn't need to be stored on any database - instead it can be
 * stored on the client side for later use.
 * @example
 * ```javascript
 * // We choose an application name on the server side
 * const application = "my-app-name"
 *
 * // On the server side, we can generate a payload for a wallet requesting to authenticate
 * const payloadWithSignature = await sdk.auth.generate({
 *   application,
 *   subject: "0x...",
 * })
 *
 * // Then on the client side, we can sign this payload with the wallet requesting to authenticate
 * const authenticatedPayload = await sdk.auth.sign(payloadWithSignature)
 *
 * // Finally, on the server side, we can verify if this payload is valid
 * const isValid = await sdk.auth.verify(application, authenticatedPayload)
 * ```
 * @beta
 */
export class WalletAuthenticator extends RPCConnectionHandler {
  constructor(network: NetworkOrSignerOrProvider, options: SDKOptions) {
    super(network, options);
  }

  /**
   * Generate an Authorized Payload
   * @remarks Generate a payload on the server side for a client side wallet to sign and use for authentication.
   * This payload enables the server side wallet to specify exactly when the wallet is authorized to authenticate,
   * and for which services they are able to access.
   *
   * @example
   * ```javascript
   * const payload = {
   *   // The name of the server-side application authorizing the payload
   *   appication: "my-app-name",
   *   // The address of the client side wallet requesting to authenticate
   *   subject: "0x...",
   *   // The server-side endpoints the wallet is authorized to access (defaults to ["*"] for access to all)
   *   endpoints: ["endpoint1", "endpoint2"],
   *   // The date object representing the time before which the authentication is invalid (defaults to now)
   *   invalidBefore: new Date(),
   *   // The date object representing the time at which the authentication expires (5 hours from now)
   *   expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
   * }
   *
   * const authorizedPayload = await sdk.auth.generate(payload)
   * ```
   *
   * @param payload - The configuration used to generate an authentication payload
   * @returns - A payload authorized by the server that the client can sign for authentication
   */
  public async generate(
    payload: AuthenticationPayloadInput,
  ): Promise<AuthorizedPayload> {
    const parsedPayload: FilledAuthenticationPayloadInput =
      AuthenticationPayloadInputSchema.parse(payload);

    const signer = this.requireSigner();
    const signerAddress = await signer.getAddress();

    const payloadOutput: AuthenticationPayloadOutput =
      AuthenticationPayloadOutputSchema.parse({
        // Add the issuer in application:address format to use on the client side
        iss: `${parsedPayload.application}:${signerAddress}`,
        sub: parsedPayload.subject,
        aud: parsedPayload.endpoints,
        nbf: parsedPayload.invalidBefore,
        exp: parsedPayload.expiresAt,
      });

    const payloadMessage = JSON.stringify(payloadOutput);
    const signature = await signer.signMessage(payloadMessage);

    const authorizedPayload = AuthorizedPayloadSchema.parse({
      payload: payloadOutput,
      authorizedPayload: signature,
    });

    return authorizedPayload;
  }

  /**
   * Sign Authorized Payload
   *
   * @remarks Sign a payload authorized by the server with the client side wallet to
   * create a token that can used for authentication.
   *
   * @example
   * ```javascript
   *
   * ```
   *
   * @param authorizedPayload - The payload signed and authorized by the server side wallet
   * @returns - The authenticated payload that can be used to send to the server
   */
  public async sign(
    authorizedPayload: AuthorizedPayload,
  ): Promise<AuthenticatedPayload> {
    // Ensure that admin address is the same as the issuer
    const adminAddress = this.recoverAddress(
      JSON.stringify(authorizedPayload.payload),
      authorizedPayload.authorizedPayload,
    );
    if (
      authorizedPayload.payload.iss.split(":")[1]?.toLowerCase() !==
      adminAddress.toLowerCase()
    ) {
      throw Error(
        "Payload issuer is not the same as the address that authorized the payload.",
      );
    }

    const signerAddress = await this.requireSigner().getAddress();
    if (
      authorizedPayload.payload.sub.toLowerCase() !==
      signerAddress.toLowerCase()
    ) {
      throw Error(
        "Payload subject is not the same as the wallet connected to the SDK.",
      );
    }

    const message = this.generateMessage(authorizedPayload);
    const signer = this.requireSigner();
    const authenticatedPayload = await signer.signMessage(message);
    const payload = AuthenticatedPayloadSchema.parse({
      ...authorizedPayload,
      authenticatedPayload,
    });

    return payload;
  }

  public async verify(
    authenticatedPayload: AuthenticatedPayload,
    application: string,
    endpoint?: string,
  ): Promise<boolean> {
    // Ensure that application of the payload is the same as the issuer application
    if (authenticatedPayload.payload.iss.split(":")[0] !== application) {
      return false;
    }

    // Ensure that the verification is called from a valid endpoint
    if (
      (endpoint && !authenticatedPayload.payload.aud.includes(endpoint)) ||
      (!endpoint && !authenticatedPayload.payload.aud.includes("*"))
    ) {
      return false;
    }

    // Recover both of the signing addresses for the payload
    const adminAddress = this.recoverAddress(
      JSON.stringify(authenticatedPayload.payload),
      authenticatedPayload.authorizedPayload,
    );
    const signerAddress = this.recoverAddress(
      this.generateMessage(authenticatedPayload),
      authenticatedPayload.authenticatedPayload,
    );

    const payload = authenticatedPayload.payload;
    const issuerAddress = payload.iss.split(":")[1];
    const connectedAddress = await this.requireSigner().getAddress();

    // Reject if the issuer is not the connected wallet doing verification
    if (issuerAddress.toLowerCase() !== connectedAddress.toLowerCase()) {
      return false;
    }

    // Reject if the issuer is not the same as the authorizer of the message
    if (issuerAddress?.toLowerCase() !== adminAddress.toLowerCase()) {
      return false;
    }

    // Reject if the subject is not the same as the authenticator of the message
    if (payload.sub.toLowerCase() !== signerAddress.toLowerCase()) {
      return false;
    }

    const currentTime = Math.floor(new Date().getTime() / 1000);

    // Reject if its before the invalid before time
    if (currentTime < payload.nbf) {
      return false;
    }

    // Reject if its after the expires at time
    if (currentTime > payload.exp) {
      return false;
    }

    return true;
  }

  private requireSigner(): ethers.Signer {
    const signer = this.getSigner();
    if (!signer) {
      throw new Error(
        "This action requires a connected wallet to sign the transaction. Please pass a valid signer to the SDK.",
      );
    }
    return signer;
  }

  private generateMessage(payload: AuthorizedPayload): string {
    const application = payload.payload.iss.split(":")[0];

    // Add the payload data to the signature so users can see what they're signing
    // This is important because it also gaurantess that they never accidentally sign a transaction
    const message = `Authenticating ${payload.payload.sub} with ${application}: \n${payload.authorizedPayload}`;
    return message;
  }

  private recoverAddress(message: string, signature: string): string {
    const messageHash = ethers.utils.hashMessage(message);
    const messageHashBytes = ethers.utils.arrayify(messageHash);
    return ethers.utils.recoverAddress(messageHashBytes, signature);
  }
}
