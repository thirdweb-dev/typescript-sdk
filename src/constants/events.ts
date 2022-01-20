export enum EventType {
  /**
   * The event is triggered when the transaction is submitted and completed.
   * The transaction is submitted when it is sent to the relayer or the blockchain.
   * The transaction is completed when it is confirmed by the blockchain.
   *
   * status: "submitted" | "completed"
   * transactionHash: string of the transaction hash
   */
  Transaction = "transaction",
}
