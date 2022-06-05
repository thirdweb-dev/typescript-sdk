import { signers } from "./before-setup";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ThirdwebSDK } from "../src";
import { AuthenticationPayloadInput } from "../src/schema/auth";

describe("Wallet Authentication", async () => {
  let adminWallet: SignerWithAddress,
    signerWallet: SignerWithAddress,
    attackerWallet: SignerWithAddress;
  let sdk: ThirdwebSDK;

  before(async () => {
    [adminWallet, signerWallet, attackerWallet] = signers;
    sdk = new ThirdwebSDK(adminWallet);
  });

  beforeEach(async () => {
    sdk.updateSignerOrProvider(adminWallet);
  });

  it("Should generate payload with default settings", async () => {
    const payloadWithSignature = await sdk.auth.generate({
      application: "thirdweb",
      subject: signerWallet.address,
    });

    expect(payloadWithSignature.payload.iss).to.equal(
      `thirdweb:${adminWallet.address}`,
    );
    expect(payloadWithSignature.payload.sub).to.equal(signerWallet.address);
    expect(payloadWithSignature.payload.aud).to.deep.equal(["*"]);
    expect(payloadWithSignature.payload.nbf).to.equal(
      payloadWithSignature.payload.iat,
    );
    expect(payloadWithSignature.payload.iat).to.equal(
      payloadWithSignature.payload.exp - 60 * 60 * 5,
    );
  });

  it("should generate payload with custom settings", async () => {
    const invalidBefore = new Date(Date.now() - 60 * 60);
    const expiresAt = new Date(Date.now() + 60 * 60);
    const payload: AuthenticationPayloadInput = {
      application: "thirdweb",
      subject: signerWallet.address,
      endpoints: ["endpoint1", "endpoint2"],
      invalidBefore,
      expiresAt,
    };
    const payloadWithSignature = await sdk.auth.generate(payload);

    expect(payloadWithSignature.payload.iss).to.equal(
      `thirdweb:${adminWallet.address}`,
    );
    expect(payloadWithSignature.payload.sub).to.equal(signerWallet.address);
    expect(payloadWithSignature.payload.aud).to.deep.equal([
      "endpoint1",
      "endpoint2",
    ]);
    expect(payloadWithSignature.payload.nbf).to.equal(
      Math.floor(invalidBefore.getTime() / 1000),
    );
    expect(payloadWithSignature.payload.exp).to.equal(
      Math.floor(expiresAt.getTime() / 1000),
    );
  });

  it("Should not sign payload with incorrect issuer", async () => {
    const payloadWithSignature = await sdk.auth.generate({
      application: "thirdweb",
      subject: signerWallet.address,
    });
    payloadWithSignature.payload.iss = `thirdweb${attackerWallet.address}`;

    sdk.updateSignerOrProvider(signerWallet);

    try {
      await sdk.auth.sign(payloadWithSignature);
      expect(false).to.equal(true);
    } catch {
      expect(true).to.equal(true);
    }
  });

  it("Should not sign payload with incorrect subject", async () => {
    const payloadWithSignature = await sdk.auth.generate({
      application: "thirdweb",
      subject: signerWallet.address,
    });
    payloadWithSignature.payload.sub = attackerWallet.address;

    sdk.updateSignerOrProvider(signerWallet);
    try {
      await sdk.auth.sign(payloadWithSignature);
      expect(false).to.equal(true);
    } catch {
      expect(true).to.equal(true);
    }
  });

  it("Should not sign payload with incorrect signer", async () => {
    const payloadWithSignature = await sdk.auth.generate({
      application: "thirdweb",
      subject: signerWallet.address,
    });

    sdk.updateSignerOrProvider(attackerWallet);
    try {
      await sdk.auth.sign(payloadWithSignature);
      expect(false).to.equal(true);
    } catch {
      expect(true).to.equal(true);
    }
  });

  it("Should reject payload before invalid before time", async () => {
    const payloadWithSignature = await sdk.auth.generate({
      application: "thirdweb",
      subject: signerWallet.address,
      invalidBefore: new Date(Date.now() + 60 * 60),
    });

    sdk.updateSignerOrProvider(signerWallet);
    const signedPayload = await sdk.auth.sign(payloadWithSignature);

    sdk.updateSignerOrProvider(adminWallet);
    const isValid = await sdk.auth.verify(signedPayload, "thirdweb");

    // eslint-disable-next-line no-unused-expressions
    expect(isValid).to.be.false;
  });

  it("Should reject payload after expiration time", async () => {
    const payloadWithSignature = await sdk.auth.generate({
      application: "thirdweb",
      subject: signerWallet.address,
      expiresAt: new Date(Date.now() - 60 * 60),
    });

    sdk.updateSignerOrProvider(signerWallet);
    const signedPayload = await sdk.auth.sign(payloadWithSignature);

    sdk.updateSignerOrProvider(adminWallet);
    const isValid = await sdk.auth.verify(signedPayload, "thirdweb");

    // eslint-disable-next-line no-unused-expressions
    expect(isValid).to.be.false;
  });

  it("Should reject payload on unauthorized endpoints", async () => {
    const payloadWithSignature = await sdk.auth.generate({
      application: "thirdweb",
      subject: signerWallet.address,
      endpoints: ["endpoint1", "endpoint2"],
    });

    sdk.updateSignerOrProvider(signerWallet);
    const signedPayload = await sdk.auth.sign(payloadWithSignature);

    sdk.updateSignerOrProvider(adminWallet);
    const isValid = await sdk.auth.verify(
      signedPayload,
      "thirdweb",
      "endpoint3",
    );

    // eslint-disable-next-line no-unused-expressions
    expect(isValid).to.be.false;
  });

  it("Should reject if no endpoint specified and not all allowed", async () => {
    const payloadWithSignature = await sdk.auth.generate({
      application: "thirdweb",
      subject: signerWallet.address,
      endpoints: ["endpoint1", "endpoint2"],
    });

    sdk.updateSignerOrProvider(signerWallet);
    const signedPayload = await sdk.auth.sign(payloadWithSignature);

    sdk.updateSignerOrProvider(adminWallet);
    const isValid = await sdk.auth.verify(signedPayload, "thirdweb");

    // eslint-disable-next-line no-unused-expressions
    expect(isValid).to.be.false;
  });

  it("Should verify payload with valid settings", async () => {
    const payloadWithSignature = await sdk.auth.generate({
      application: "thirdweb",
      subject: signerWallet.address,
      endpoints: ["endpoint1"],
    });

    sdk.updateSignerOrProvider(signerWallet);
    const signedPayload = await sdk.auth.sign(payloadWithSignature);

    sdk.updateSignerOrProvider(adminWallet);
    const isValid = await sdk.auth.verify(
      signedPayload,
      "thirdweb",
      "endpoint1",
    );

    // eslint-disable-next-line no-unused-expressions
    expect(isValid).to.be.true;
  });
});
