export enum ClaimEligibility {
  NotEnoughSupply = "There is not enough supply to claim.",

  AddressNotAllowed = "This address is not on the allowlist.",

  WaitBeforeNextClaimTransaction = "Not enough time since last claim transaction. Please wait.",

  NotEnoughTokens = "There are not enough tokens in the wallet to pay for the claim.",

  NoActiveClaimPhase = "There is no active claim phase at the moment. Please check back in later.",
}
