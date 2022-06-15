import { ethers } from "ethers";
import { isBrowser } from "../../common/utils";
import { SDKOptions } from "../../schema";
import {
  LoginOptions,
  LoginPayload,
  AuthenticationOptions,
  LoginPayloadData,
  LoginPayloadDataSchema,
  AuthenticationPayloadDataSchema,
  AuthenticationPayloadData,
} from "../../schema/auth";
import { RPCConnectionHandler } from "../classes/rpc-connection-handler";
import { NetworkOrSignerOrProvider } from "../types";
import { UserWallet } from "../wallet";

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
  private wallet: UserWallet;

  constructor(
    network: NetworkOrSignerOrProvider,
    wallet: UserWallet,
    options: SDKOptions,
  ) {
    super(network, options);
    this.wallet = wallet;
  }

  /**
   * Login With Connected Wallet
   * @remarks Client-side function that allows the connected wallet to login to a server-side application.
   * Generates a login payload that can be sent to the server-side for verification or authentication.
   * 
   * @param domain - The domain of the server-side application to login to
   * @param options - Optional configuration options for the login request
   * @returns Login payload that can be used on the server-side to verify the login request or authenticate
   * 
   * @example
   * ```javascript
   * // Add the domain of the application users will login to, this will be used throughout the login process
   * const domain = "thirdweb.com";
   * // Generate a signed login payload for the connected wallet to authenticate with
   * const loginPayload = await sdk.auth.login(domain);
   * ```
   */
  public async login(
    domain: string, 
    options?: LoginOptions
  ): Promise<LoginPayload> {
    const signerAddress = await this.wallet.getAddress();
    const payloadData = LoginPayloadDataSchema.parse({
      address: signerAddress,
      ...options,
    });

    const message = this.generateMessage(domain, payloadData);
    const signature = await this.wallet.sign(message);
    
    return {
      payload: payloadData,
      signature,
    }
  }

  /**
   * Verify Logged In Address
   * @remarks Server-side function to securely verify the address of the logged in client-side wallet 
   * by validating the provided client-side login request.
   * 
   * @param domain - The domain of the server-side application to verify the login request for
   * @param payload - The login payload to verify
   * @returns Address of the logged in wallet
   * 
   * @example
   * ```javascript
   * const domain = "thirdweb.com";
   * const loginPayload = await sdk.auth.login(domain);
   * 
   * // Verify the login request
   * const address = sdk.auth.verifyLogin(domain, loginPayload);
   * ```
   */
  public verify(
    domain: string, 
    payload: LoginPayload
  ): string {
    if (isBrowser()) {
      throw new Error("Should not verify login on the browser.");
    }

    const message = this.generateMessage(domain, payload.payload);
    const userAddress = this.recoverAddress(message, payload.signature);
    if (userAddress.toLowerCase() !== payload.payload.address.toLowerCase()) {
      throw new Error(
        `User address ${userAddress.toLowerCase()} does not match payload address ${payload.payload.address.toLowerCase()}`
      );
    }

    const currentTime = new Date();
    if (currentTime > new Date(payload.payload.expirationTime)) {
      throw new Error(`Login request has expired.`);
    }

    return userAddress;
  }

  /**
   * Generate Authentication Token
   * @remarks Server-side function that generates a JWT token from the provided login request that the
   * client-side wallet can use to authenticate to the server-side application.
   * 
   * @param domain - The domain of the server-side application to authenticate to
   * @param payload - The login payload to authenticate with
   * @param options - Optional configuration options for the authentication request
   * @returns A authentication payload that can be used by the client to make authenticated requests
   * 
   * @example
   * ```javascript
   * const domain = "thirdweb.com";
   * const loginPayload = await sdk.auth.login(domain);
   * 
   * // Generate a JWT token that can be sent to the client-side wallet and used for authentication
   * const token = await sdk.auth.generate(domain, loginPayload);
   * ```
   */
  public async generate(
    domain: string,
    payload: LoginPayload,
    options?: AuthenticationOptions
  ): Promise<string> {
    if (isBrowser()) {
      throw new Error("Authentication tokens should not be generated in the browser.");
    }

    const userAddress = this.verify(domain, payload);
    const adminAddress = await this.wallet.getAddress();
    const payloadData = AuthenticationPayloadDataSchema.parse({
      iss: adminAddress,
      sub: userAddress,
      aud: domain,
      nbf: options?.invalidBefore,
      exp: options?.expirationTime,
    })

    const message = JSON.stringify(payloadData);
    const signature = await this.wallet.sign(message);

    // Header used for JWT token specifying hash algorithm
    const header = {
      // Specify ECDSA with SHA-256 for hashing algorithm
      alg: "ES256",
      typ: "JWT",
    }

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64");
    const encodedData = Buffer.from(JSON.stringify(payloadData)).toString("base64");
    const encodedSignature = Buffer.from(signature).toString("base64");

    // Generate a JWT token with base64 encoded header, payload, and signature
    const token = `${encodedHeader}.${encodedData}.${encodedSignature}`;
  
    return token;
  }

  /**
   * Authenticate With Token
   * @remarks Server-side function that authenticates the provided JWT token. This function verifies that
   * the provided authentication token is valid and returns the address of the authenticated wallet.
   * 
   * @param domain - The domain of the server-side application doing authentication
   * @param token - The authentication token being used
   * @returns The address of the authenticated wallet
   * 
   * @example
   * ```javascript
   * 
   * ```
   */
  public async authenticate(
    domain: string,
    token: string,
  ): Promise<string> {
    if (isBrowser()) {
      throw new Error("Should not authenticate tokens in the browser.");
    }

    const encodedPayload = token.split(".")[1];
    const encodedSignature = token.split(".")[2];

    const payload: AuthenticationPayloadData = JSON.parse(Buffer.from(encodedPayload, "base64").toString());
    const signature = Buffer.from(encodedSignature, "base64").toString();

    const connectedAddress = await this.wallet.getAddress();
    if (connectedAddress.toLowerCase() !== payload.iss.toLowerCase()) {
      throw new Error(
        `Expected the connected wallet address ${connectedAddress} to match the token issuer address ${payload.iss}`
      );
    }

    const adminAddress = this.recoverAddress(JSON.stringify(payload), signature,);
    if (connectedAddress.toLowerCase() === adminAddress.toLowerCase()) {
      throw new Error(
        `Expected token signer address ${adminAddress} to match the connected wallet address ${connectedAddress}`
      );
    }

    if (payload.aud !== domain) {
      throw new Error(
        `Expected token to be for the domain ${domain}, but found token with domain ${payload.aud}`
      );
    }

    const currentTime = Math.floor(new Date().getTime() / 1000);
    if (currentTime < payload.nbf) {
      throw new Error(`This token is invalid before epoch time ${payload.nbf}, current epoch time is ${currentTime}`);
    }

    // Reject if its after the expires at time
    if (currentTime > payload.exp) {
      throw new Error(`This token expired at epoch time ${payload.exp}, current epcoh time is ${currentTime}`);
    }

    return payload.sub;
  }

  /**
   * Generates a EIP-4361 compliant message to sign based on the 
   */
  private generateMessage(domain: string, payload: LoginPayloadData): string {
    let message = ``;

    // Add the domain and login address for transparency
    message += `${domain} wants you to sign in with your account:\n${payload.address}\n\n`

    // Prompt user to make sure domain is correct to prevent phishing attacks
    message += `Make sure that the request domain above matches the URL of the current website.\n\n`

    // Add data fields in copliance with the AIP-4361 standard
    if (payload.chainId) {
      message += `Chain ID: ${payload.chainId}\n`;
    }

    message += `Nonce: ${payload.nonce}\n`;
    message += `Expiration Time: ${payload.expirationTime}\n`;

    return message;
  }

  /**
   * Recover the signing address from a signed message
   */
  private recoverAddress(message: string, signature: string): string {
    const messageHash = ethers.utils.hashMessage(message);
    const messageHashBytes = ethers.utils.arrayify(messageHash);
    return ethers.utils.recoverAddress(messageHashBytes, signature);
  }
}
