import {
  FilledSignaturePayload20,
  MintRequest20,
  PayloadToSign20,
  PayloadWithUri20,
  Signature20PayloadInput,
  Signature20PayloadOutput,
  SignedPayload20,
} from "../../schema/contracts/common/signature";
import { TransactionResult } from "../types";
import { normalizePriceValue, setErc20Allowance } from "../../common/currency";
import { BigNumber, ethers } from "ethers";
import invariant from "tiny-invariant";
import { ContractWrapper } from "./contract-wrapper";
import { ITokenERC20, TokenERC20 } from "@thirdweb-dev/contracts";
import { ContractRoles } from "./contract-roles";
import { Token } from "../../contracts";

/**
 * Enables generating ERC20 Tokens with rules and an associated signature, which can then be minted by anyone securely
 * @public
 */
export class Erc20SignatureMinting {
  private contractWrapper: ContractWrapper<TokenERC20>;
  private roles: ContractRoles<TokenERC20, typeof Token.contractRoles[number]>;

  constructor(
    contractWrapper: ContractWrapper<TokenERC20>,
    roles: ContractRoles<TokenERC20, typeof Token.contractRoles[number]>,
  ) {
    this.contractWrapper = contractWrapper;
    this.roles = roles;
  }

  /**
   * Mint a dynamically generated NFT
   *
   * @remarks Mint a dynamic NFT with a previously generated signature.
   *
   * @example
   * ```javascript
   * // see how to craft a payload to sign in the `generate()` documentation
   * const signedPayload = contract.signature.generate(payload);
   *
   * // now anyone can mint the NFT
   * const tx = contract.signature.mint(signedPayload);
   * const receipt = tx.receipt; // the mint transaction receipt
   * const mintedId = tx.id; // the id of the NFT minted
   * ```
   * @param signedPayload - the previously generated payload and signature with {@link Erc20SignatureMinting.generate}
   */
  public async mint(
    signedPayload: SignedPayload20,
  ): Promise<TransactionResult> {
    const mintRequest = signedPayload.payload;
    const signature = signedPayload.signature;
    const message = await this.mapPayloadToContractStruct(mintRequest);
    const overrides = await this.contractWrapper.getCallOverrides();
    await setErc20Allowance(
      this.contractWrapper,
      BigNumber.from(message.price),
      mintRequest.currencyAddress,
      overrides,
    );
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "mintWithSignature",
        [message, signature],
        overrides,
      ),
    };
  }

  /**
   * Mint any number of dynamically generated NFT at once
   * @remarks Mint multiple dynamic NFTs in one transaction. Note that this is only possible for free mints (cannot batch mints with a price attached to it for security reasons)
   * @param signedPayloads - the array of signed payloads to mint
   */
  public async mintBatch(
    signedPayloads: SignedPayload20[],
  ): Promise<TransactionResult> {
    const contractPayloads = await Promise.all(
      signedPayloads.map(async (s) => {
        const message = await this.mapPayloadToContractStruct(s.payload);
        const signature = s.signature;
        const price = s.payload.price;
        if (BigNumber.from(price).gt(0)) {
          throw new Error(
            "Can only batch free mints. For mints with a price, use regular mint()",
          );
        }
        return {
          message,
          signature,
        };
      }),
    );
    const encoded = contractPayloads.map((p) => {
      return this.contractWrapper.readContract.interface.encodeFunctionData(
        "mintWithSignature",
        [p.message, p.signature],
      );
    });
    return {
      receipt: await this.contractWrapper.multiCall(encoded),
    };
  }

  /**
   * Verify that a payload is correctly signed
   * @param signedPayload - the payload to verify
   */
  public async verify(signedPayload: SignedPayload20): Promise<boolean> {
    const mintRequest = signedPayload.payload;
    const signature = signedPayload.signature;
    const message = await this.mapPayloadToContractStruct(mintRequest);
    const verification: [boolean, string] =
      await this.contractWrapper.readContract.verify(message, signature);
    return verification[0];
  }

  /**
   * Generate a signature that can be used to mint a dynamic NFT
   *
   * @remarks Takes in an NFT and some information about how it can be minted, uploads the metadata and signs it with your private key. The generated signature can then be used to mint an NFT using the exact payload and signature generated.
   *
   * @example
   * ```javascript
   * const nftMetadata = {
   *   name: "Cool NFT #1",
   *   description: "This is a cool NFT",
   *   image: fs.readFileSync("path/to/image.png"), // This can be an image url or file
   * };
   *
   * const startTime = new Date();
   * const endTime = new Date(Date.now() + 60 * 60 * 24 * 1000);
   * const payload = {
   *   metadata: nftMetadata, // The NFT to mint
   *   to: {{wallet_address}}, // Who will receive the NFT (or AddressZero for anyone)
   *   price: 0.5, // the price to pay for minting
   *   currencyAddress: NATIVE_TOKEN_ADDRESS, // the currency to pay with
   *   mintStartTime: now, // can mint anytime from now
   *   mintEndTime: endTime, // to 24h from now,
   *   royaltyRecipient: "0x...", // custom royalty recipient for this NFT
   *   royaltyBps: 100, // custom royalty fees for this NFT (in bps)
   *   primarySaleRecipient: "0x...", // custom sale recipient for this NFT
   * };
   *
   * const signedPayload = contract.signature.generate(payload);
   * // now anyone can use these to mint the NFT using `contract.signature.mint(signedPayload)`
   * ```
   * @param mintRequest - the payload to sign
   * @returns the signed payload and the corresponding signature
   */
  public async generate(
    mintRequest: PayloadToSign20,
  ): Promise<SignedPayload20> {
    return (await this.generateBatch([mintRequest]))[0];
  }

  /**
   * Genrate a batch of signatures that can be used to mint many dynamic NFTs.
   *
   * @remarks See {@link Erc20SignatureMinting.generate}
   *
   * @param payloadsToSign - the payloads to sign
   * @returns an array of payloads and signatures
   */
  public async generateBatch(
    payloadsToSign: PayloadToSign20[],
  ): Promise<SignedPayload20[]> {
    await this.roles.verify(
      ["minter"],
      await this.contractWrapper.getSignerAddress(),
    );

    const parsedRequests: FilledSignaturePayload20[] = payloadsToSign.map((m) =>
      Signature20PayloadInput.parse(m),
    );

    const chainId = await this.contractWrapper.getChainID();
    const signer = this.contractWrapper.getSigner();
    invariant(signer, "No signer available");

    // ERC20Permit (EIP-712) spec differs from signature mint 721, 1155.
    const name = await this.contractWrapper.readContract.name();

    return await Promise.all(
      parsedRequests.map(async (m) => {
        const finalPayload = Signature20PayloadOutput.parse(m);
        console.log(await this.mapPayloadToContractStruct(finalPayload));
        const signature = await this.contractWrapper.signTypedData(
          signer,
          {
            name,
            version: "1",
            chainId,
            verifyingContract: this.contractWrapper.readContract.address,
          },
          { MintRequest: MintRequest20 },
          await this.mapPayloadToContractStruct(finalPayload),
        );
        return {
          payload: finalPayload,
          signature: signature.toString(),
        };
      }),
    );
  }

  /** ******************************
   * PRIVATE FUNCTIONS
   *******************************/

  /**
   * Maps a payload to the format expected by the contract
   *
   * @internal
   *
   * @param mintRequest - The payload to map.
   * @returns - The mapped payload.
   */
  private async mapPayloadToContractStruct(
    mintRequest: PayloadWithUri20,
  ): Promise<ITokenERC20.MintRequestStructOutput> {
    const normalizedPrice = await normalizePriceValue(
      this.contractWrapper.getProvider(),
      mintRequest.price,
      mintRequest.currencyAddress,
    );
    const amountWithDecimals = ethers.utils.parseUnits(
      mintRequest.quantity,
      await this.contractWrapper.readContract.decimals(),
    );
    return {
      to: mintRequest.to,
      primarySaleRecipient: mintRequest.primarySaleRecipient,
      quantity: amountWithDecimals,
      price: normalizedPrice,
      currency: mintRequest.currencyAddress,
      validityStartTimestamp: mintRequest.mintStartTime,
      validityEndTimestamp: mintRequest.mintEndTime,
      uid: mintRequest.uid,
    } as ITokenERC20.MintRequestStructOutput;
  }
}
