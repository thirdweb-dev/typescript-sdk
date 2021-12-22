export enum ClaimEligibility {
  NotEnoughSupply = "There is not enough supply to claim.",

  AddressNotWhitelisted = "This address is not whitelisted.",

  WaitBeforeNextClaimTransaction = "Not enough time since last claim transaction. Please wait.",

  NotEnoughTokens = "There are not enough tokens in the wallet to pay for the claim.",

  NoActiveClaimPhase = "There is no active claim phase at the moment. Please check back in later.",
}
