/* tslint:disable */
/* eslint-disable */

export class LazyMintERC1155__factory {
  static readonly abi = [
    {
      inputs: [
        {
          internalType: "string",
          name: "_contractURI",
          type: "string",
        },
        {
          internalType: "address payable",
          name: "_controlCenter",
          type: "address",
        },
        {
          internalType: "address",
          name: "_trustedForwarder",
          type: "address",
        },
        {
          internalType: "address",
          name: "_nativeTokenWrapper",
          type: "address",
        },
        {
          internalType: "address",
          name: "_saleRecipient",
          type: "address",
        },
        {
          internalType: "uint128",
          name: "_royaltyBps",
          type: "uint128",
        },
        {
          internalType: "uint128",
          name: "_feeBps",
          type: "uint128",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "account",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "operator",
          type: "address",
        },
        {
          indexed: false,
          internalType: "bool",
          name: "approved",
          type: "bool",
        },
      ],
      name: "ApprovalForAll",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "claimConditionIndex",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "address",
          name: "claimer",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "quantityClaimed",
          type: "uint256",
        },
      ],
      name: "ClaimedTokens",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "startTokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "endTokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "string",
          name: "baseURI",
          type: "string",
        },
      ],
      name: "LazyMintedTokens",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          components: [
            {
              internalType: "uint256",
              name: "startTimestamp",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "maxClaimableSupply",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "supplyClaimed",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantityLimitPerTransaction",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "waitTimeInSecondsBetweenClaims",
              type: "uint256",
            },
            {
              internalType: "bytes32",
              name: "merkleRoot",
              type: "bytes32",
            },
            {
              internalType: "uint256",
              name: "pricePerToken",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "currency",
              type: "address",
            },
          ],
          indexed: false,
          internalType: "struct ILazyMintERC1155.ClaimCondition[]",
          name: "claimConditions",
          type: "tuple[]",
        },
      ],
      name: "NewClaimConditions",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "prevOwner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "NewOwner",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "recipient",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "bool",
          name: "isDefaultRecipient",
          type: "bool",
        },
      ],
      name: "NewSaleRecipient",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "newFeeBps",
          type: "uint256",
        },
      ],
      name: "PrimarySalesFeeUpdates",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "bytes32",
          name: "previousAdminRole",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "bytes32",
          name: "newAdminRole",
          type: "bytes32",
        },
      ],
      name: "RoleAdminChanged",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "address",
          name: "account",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
      ],
      name: "RoleGranted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "address",
          name: "account",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
      ],
      name: "RoleRevoked",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "newRoyaltyBps",
          type: "uint256",
        },
      ],
      name: "RoyaltyUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "operator",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256[]",
          name: "ids",
          type: "uint256[]",
        },
        {
          indexed: false,
          internalType: "uint256[]",
          name: "values",
          type: "uint256[]",
        },
      ],
      name: "TransferBatch",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "operator",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "TransferSingle",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bool",
          name: "restricted",
          type: "bool",
        },
      ],
      name: "TransfersRestricted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "string",
          name: "value",
          type: "string",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
      ],
      name: "URI",
      type: "event",
    },
    {
      inputs: [],
      name: "DEFAULT_ADMIN_ROLE",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "MINTER_ROLE",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "NATIVE_TOKEN",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "TRANSFER_ROLE",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address[]",
          name: "accounts",
          type: "address[]",
        },
        {
          internalType: "uint256[]",
          name: "ids",
          type: "uint256[]",
        },
      ],
      name: "balanceOfBatch",
      outputs: [
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "burn",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
        {
          internalType: "uint256[]",
          name: "ids",
          type: "uint256[]",
        },
        {
          internalType: "uint256[]",
          name: "values",
          type: "uint256[]",
        },
      ],
      name: "burnBatch",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_quantity",
          type: "uint256",
        },
        {
          internalType: "bytes32[]",
          name: "_proofs",
          type: "bytes32[]",
        },
      ],
      name: "claim",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "claimConditions",
      outputs: [
        {
          internalType: "uint256",
          name: "totalConditionCount",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "timstampLimitIndex",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "contractURI",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "defaultSaleRecipient",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "feeBps",
      outputs: [
        {
          internalType: "uint120",
          name: "",
          type: "uint120",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_index",
          type: "uint256",
        },
      ],
      name: "getClaimConditionAtIndex",
      outputs: [
        {
          components: [
            {
              internalType: "uint256",
              name: "startTimestamp",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "maxClaimableSupply",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "supplyClaimed",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantityLimitPerTransaction",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "waitTimeInSecondsBetweenClaims",
              type: "uint256",
            },
            {
              internalType: "bytes32",
              name: "merkleRoot",
              type: "bytes32",
            },
            {
              internalType: "uint256",
              name: "pricePerToken",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "currency",
              type: "address",
            },
          ],
          internalType: "struct ILazyMintERC1155.ClaimCondition",
          name: "mintCondition",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
      ],
      name: "getIndexOfActiveCondition",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
      ],
      name: "getRoleAdmin",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          internalType: "uint256",
          name: "index",
          type: "uint256",
        },
      ],
      name: "getRoleMember",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
      ],
      name: "getRoleMemberCount",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_index",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_claimer",
          type: "address",
        },
      ],
      name: "getTimestampForNextValidClaim",
      outputs: [
        {
          internalType: "uint256",
          name: "nextValidTimestampForClaim",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "grantRole",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "hasRole",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
        {
          internalType: "address",
          name: "operator",
          type: "address",
        },
      ],
      name: "isApprovedForAll",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "forwarder",
          type: "address",
        },
      ],
      name: "isTrustedForwarder",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
        {
          internalType: "string",
          name: "_baseURIForTokens",
          type: "string",
        },
      ],
      name: "lazyMint",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes[]",
          name: "data",
          type: "bytes[]",
        },
      ],
      name: "multicall",
      outputs: [
        {
          internalType: "bytes[]",
          name: "results",
          type: "bytes[]",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "nativeTokenWrapper",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "nextTokenIdToMint",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "renounceRole",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "revokeRole",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "royaltyBps",
      outputs: [
        {
          internalType: "uint64",
          name: "",
          type: "uint64",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "salePrice",
          type: "uint256",
        },
      ],
      name: "royaltyInfo",
      outputs: [
        {
          internalType: "address",
          name: "receiver",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "royaltyAmount",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256[]",
          name: "ids",
          type: "uint256[]",
        },
        {
          internalType: "uint256[]",
          name: "amounts",
          type: "uint256[]",
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes",
        },
      ],
      name: "safeBatchTransferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes",
        },
      ],
      name: "safeTransferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "saleRecipient",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "operator",
          type: "address",
        },
        {
          internalType: "bool",
          name: "approved",
          type: "bool",
        },
      ],
      name: "setApprovalForAll",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
        {
          components: [
            {
              internalType: "uint256",
              name: "startTimestamp",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "maxClaimableSupply",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "supplyClaimed",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantityLimitPerTransaction",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "waitTimeInSecondsBetweenClaims",
              type: "uint256",
            },
            {
              internalType: "bytes32",
              name: "merkleRoot",
              type: "bytes32",
            },
            {
              internalType: "uint256",
              name: "pricePerToken",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "currency",
              type: "address",
            },
          ],
          internalType: "struct ILazyMintERC1155.ClaimCondition[]",
          name: "_conditions",
          type: "tuple[]",
        },
      ],
      name: "setClaimConditions",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "_uri",
          type: "string",
        },
      ],
      name: "setContractURI",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_saleRecipient",
          type: "address",
        },
      ],
      name: "setDefaultSaleRecipient",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_feeBps",
          type: "uint256",
        },
      ],
      name: "setFeeBps",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_newOwner",
          type: "address",
        },
      ],
      name: "setOwner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bool",
          name: "_restrictedTransfer",
          type: "bool",
        },
      ],
      name: "setRestrictedTransfer",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_royaltyBps",
          type: "uint256",
        },
      ],
      name: "setRoyaltyBps",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_saleRecipient",
          type: "address",
        },
      ],
      name: "setSaleRecipient",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes4",
          name: "interfaceId",
          type: "bytes4",
        },
      ],
      name: "supportsInterface",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
      ],
      name: "tokenURI",
      outputs: [
        {
          internalType: "string",
          name: "_tokenURI",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "totalSupply",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "transfersRestricted",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
        {
          components: [
            {
              internalType: "uint256",
              name: "startTimestamp",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "maxClaimableSupply",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "supplyClaimed",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantityLimitPerTransaction",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "waitTimeInSecondsBetweenClaims",
              type: "uint256",
            },
            {
              internalType: "bytes32",
              name: "merkleRoot",
              type: "bytes32",
            },
            {
              internalType: "uint256",
              name: "pricePerToken",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "currency",
              type: "address",
            },
          ],
          internalType: "struct ILazyMintERC1155.ClaimCondition[]",
          name: "_conditions",
          type: "tuple[]",
        },
      ],
      name: "updateClaimConditions",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
      ],
      name: "uri",
      outputs: [
        {
          internalType: "string",
          name: "_tokenURI",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];
  static readonly bytecode =
    "0x60a06040523480156200001157600080fd5b5060405162005daa38038062005daa833981016040819052620000349162000446565b604080516020810190915260008152859062000050816200017c565b50600380546001600160a01b03199081166001600160a01b03938416179091556001600655600c80548216898416179055858216608052600880549091169185169190911790558651620000ac90600b9060208a019062000355565b50600a80546001600160781b03831668010000000000000000026001600160b81b03199091166001600160401b038516171790556000620000ec62000195565b600780546001600160a01b0319166001600160a01b038316179055905062000116600082620001b1565b620001427f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a682620001b1565b6200016e7f8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c82620001b1565b5050505050505050620005d1565b80516200019190600290602084019062000355565b5050565b6000620001ac620001bd60201b620020651760201c565b905090565b620001918282620001f6565b6003546000906001600160a01b0316331415620001e1575060131936013560601c90565b620001ac6200023960201b620020901760201c565b6200020d82826200023d60201b620020941760201c565b60008281526005602090815260409091206200023491839062002137620002e3821b17901c565b505050565b3390565b60008281526004602090815260408083206001600160a01b038516845290915290205460ff16620001915760008281526004602090815260408083206001600160a01b03851684529091529020805460ff191660011790556200029f62000195565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b6000620002fa836001600160a01b03841662000303565b90505b92915050565b60008181526001830160205260408120546200034c57508154600181810184556000848152602080822090930184905584548482528286019093526040902091909155620002fd565b506000620002fd565b828054620003639062000594565b90600052602060002090601f016020900481019282620003875760008555620003d2565b82601f10620003a257805160ff1916838001178555620003d2565b82800160010185558215620003d2579182015b82811115620003d2578251825591602001919060010190620003b5565b50620003e0929150620003e4565b5090565b5b80821115620003e05760008155600101620003e5565b634e487b7160e01b600052604160045260246000fd5b80516001600160a01b03811681146200042957600080fd5b919050565b80516001600160801b03811681146200042957600080fd5b600080600080600080600060e0888a0312156200046257600080fd5b87516001600160401b03808211156200047a57600080fd5b818a0191508a601f8301126200048f57600080fd5b815181811115620004a457620004a4620003fb565b604051601f8201601f19908116603f01168101908382118183101715620004cf57620004cf620003fb565b81604052828152602093508d84848701011115620004ec57600080fd5b600091505b82821015620005105784820184015181830185015290830190620004f1565b82821115620005225760008484830101525b9a50620005349150508a820162000411565b97505050620005466040890162000411565b9450620005566060890162000411565b9350620005666080890162000411565b92506200057660a089016200042e565b91506200058660c089016200042e565b905092959891949750929550565b600181811c90821680620005a957607f821691505b60208210811415620005cb57634e487b7160e01b600052602260045260246000fd5b50919050565b6080516157a16200060960003960008181610b4d01528181613f16015281816140110152818161452d01526145a401526157a16000f3fe6080604052600436106103285760003560e01c80638ba448c2116101a5578063c63adb2b116100ec578063d547741f11610095578063eb56a8e51161006f578063eb56a8e514610adb578063f242432a14610afb578063f5298aca14610b1b578063f9ea29cb14610b3b57600080fd5b8063d547741f14610a5d578063e8a3d48514610a7d578063e985e9c514610a9257600080fd5b8063ca15c873116100c6578063ca15c8731461097f578063cc9599141461099f578063d539139314610a2957600080fd5b8063c63adb2b146108ef578063c7337d6b14610929578063c87b56dd1461095f57600080fd5b80639e45e4661161014e578063ac9650d811610128578063ac9650d814610882578063ae0b51df146108af578063bd85b039146108c257600080fd5b80639e45e4661461082d578063a217fddf1461084d578063a22cb4651461086257600080fd5b80639010d07c1161017f5780639010d07c146107a757806391d14854146107c7578063938e3d7b1461080d57600080fd5b80638ba448c2146107525780638d8b4f38146107725780638da5cb5b1461079257600080fd5b80632f2ff15d116102745780634e1273f41161021d57806372c27b62116101f757806372c27b62146106a857806372cc0198146106c85780638423df79146106e8578063860ec5d11461070957600080fd5b80634e1273f41461062c578063572b6c05146106595780636b20c4541461068857600080fd5b80633b1475a71161024e5780633b1475a7146105d657806347158264146105ec5780634d4529a01461060c57600080fd5b80632f2ff15d1461056e57806331f7d9641461058e57806336568abe146105b657600080fd5b8063206b60f9116102d657806324a9d853116102b057806324a9d853146104bb5780632a55205a1461050f5780632eb2c2d61461054e57600080fd5b8063206b60f91461041f578063246b436b14610453578063248a9ca31461048b57600080fd5b806313af40351161030757806313af4035146103bd5780631490ee76146103df5780631f72d831146103ff57600080fd5b8062fdd58e1461032d57806301ffc9a7146103605780630e89341c14610390575b600080fd5b34801561033957600080fd5b5061034d61034836600461491b565b610b6f565b6040519081526020015b60405180910390f35b34801561036c57600080fd5b5061038061037b36600461495d565b610c1b565b6040519015158152602001610357565b34801561039c57600080fd5b506103b06103ab36600461497a565b610c51565b60405161035791906149eb565b3480156103c957600080fd5b506103dd6103d83660046149fe565b610d0e565b005b3480156103eb57600080fd5b506103dd6103fa3660046149fe565b610e43565b34801561040b57600080fd5b506103dd61041a36600461497a565b610eea565b34801561042b57600080fd5b5061034d7f8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c81565b34801561045f57600080fd5b50600854610473906001600160a01b031681565b6040516001600160a01b039091168152602001610357565b34801561049757600080fd5b5061034d6104a636600461497a565b60009081526004602052604090206001015490565b3480156104c757600080fd5b50600a546104ef906801000000000000000090046effffffffffffffffffffffffffffff1681565b6040516effffffffffffffffffffffffffffff9091168152602001610357565b34801561051b57600080fd5b5061052f61052a366004614a1b565b610fcd565b604080516001600160a01b039093168352602083019190915201610357565b34801561055a57600080fd5b506103dd610569366004614b89565b61107e565b34801561057a57600080fd5b506103dd610589366004614c37565b611132565b34801561059a57600080fd5b5061047373eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee81565b3480156105c257600080fd5b506103dd6105d1366004614c37565b611164565b3480156105e257600080fd5b5061034d60095481565b3480156105f857600080fd5b506103dd610607366004614cb0565b611200565b34801561061857600080fd5b506103dd610627366004614c37565b611338565b34801561063857600080fd5b5061064c610647366004614cfc565b6113ea565b6040516103579190614e04565b34801561066557600080fd5b506103806106743660046149fe565b6003546001600160a01b0391821691161490565b34801561069457600080fd5b506103dd6106a3366004614e17565b611528565b3480156106b457600080fd5b506103dd6106c336600461497a565b6115c0565b3480156106d457600080fd5b5061034d6106e336600461497a565b6116c5565b3480156106f457600080fd5b50600a5461038090600160b81b900460ff1681565b34801561071557600080fd5b5061073d61072436600461497a565b6010602052600090815260409020805460019091015482565b60408051928352602083019190915201610357565b34801561075e57600080fd5b506103dd61076d366004614e9b565b6117cc565b34801561077e57600080fd5b506103dd61078d366004614eb8565b611881565b34801561079e57600080fd5b50610473611927565b3480156107b357600080fd5b506104736107c2366004614a1b565b611980565b3480156107d357600080fd5b506103806107e2366004614c37565b60009182526004602090815260408084206001600160a01b0393909316845291905290205460ff1690565b34801561081957600080fd5b506103dd610828366004614f37565b61199f565b34801561083957600080fd5b506103dd610848366004614eb8565b6119f8565b34801561085957600080fd5b5061034d600081565b34801561086e57600080fd5b506103dd61087d366004614f79565b611a90565b34801561088e57600080fd5b506108a261089d366004614fec565b611aa2565b6040516103579190615022565b6103dd6108bd366004615084565b611b97565b3480156108ce57600080fd5b5061034d6108dd36600461497a565b600f6020526000908152604090205481565b3480156108fb57600080fd5b50600a546109109067ffffffffffffffff1681565b60405167ffffffffffffffff9091168152602001610357565b34801561093557600080fd5b5061047361094436600461497a565b6011602052600090815260409020546001600160a01b031681565b34801561096b57600080fd5b506103b061097a36600461497a565b611cf6565b34801561098b57600080fd5b5061034d61099a36600461497a565b611d01565b3480156109ab57600080fd5b506109bf6109ba366004614a1b565b611d18565b6040516103579190600061010082019050825182526020830151602083015260408301516040830152606083015160608301526080830151608083015260a083015160a083015260c083015160c08301526001600160a01b0360e08401511660e083015292915050565b348015610a3557600080fd5b5061034d7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a681565b348015610a6957600080fd5b506103dd610a78366004614c37565b611ded565b348015610a8957600080fd5b506103b0611e15565b348015610a9e57600080fd5b50610380610aad3660046150d7565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205460ff1690565b348015610ae757600080fd5b5061034d610af6366004615105565b611ea3565b348015610b0757600080fd5b506103dd610b1636600461513e565b611f20565b348015610b2757600080fd5b506103dd610b363660046151a7565b611fcd565b348015610b4757600080fd5b506104737f000000000000000000000000000000000000000000000000000000000000000081565b60006001600160a01b038316610bf25760405162461bcd60e51b815260206004820152602b60248201527f455243313135353a2062616c616e636520717565727920666f7220746865207a60448201527f65726f206164647265737300000000000000000000000000000000000000000060648201526084015b60405180910390fd5b506000818152602081815260408083206001600160a01b03861684529091529020545b92915050565b60006001600160e01b03198216636cdb3d1360e11b1480610c1557506001600160e01b0319821663152a902d60e11b1492915050565b606060005b600d54811015610cf857600d8181548110610c7357610c736151dc565b9060005260206000200154831015610ce657600e6000600d8381548110610c9c57610c9c6151dc565b90600052602060002001548152602001908152602001600020610cbe8461214c565b604051602001610ccf929190615249565b604051602081830303815290604052915050919050565b610cf1600182615306565b9050610c56565b5050604080516020810190915260008152919050565b610d1b60006107e261224a565b610d5b5760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610be9565b6001600160a01b03811660009081527f17ef568e3e12ab5b9c7254a8d58478811de00f9e6eb34345acd53bf8fd09d3ec602052604090205460ff16610de25760405162461bcd60e51b815260206004820152601b60248201527f6e6577206f776e6572206e6f74206d6f64756c652061646d696e2e00000000006044820152606401610be9565b600780546001600160a01b038381166001600160a01b031983168117909355604080519190921680825260208201939093527f70aea8d848e8a90fb7661b227dc522eb6395c3dac71b63cb59edd5c9899b2364910160405180910390a15050565b610e5060006107e261224a565b610e905760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610be9565b600880546001600160a01b0319166001600160a01b0383169081179091556040516001815260001991907fdfa24b2c84f4b56930965774ade10cc0167141522e42b2863e191e8426fdc7d39060200160405180910390a350565b610ef760006107e261224a565b610f375760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610be9565b612710811115610f795760405162461bcd60e51b815260206004820152600d60248201526c313839901e1e9018981818181760991b6044820152606401610be9565b600a805467ffffffffffffffff191667ffffffffffffffff83161790556040518181527f244ea8d7627f5a08f4299862bd5a45752842c183aee5b0fb0d1e4887bfa605b3906020015b60405180910390a150565b600c5460405163f2aab4b360e01b815230600482015260009182916001600160a01b039091169063f2aab4b39060240160206040518083038186803b15801561101557600080fd5b505afa158015611029573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061104d919061531e565b600a549092506127109061106b9067ffffffffffffffff168561533b565b6110759190615370565b90509250929050565b61108661224a565b6001600160a01b0316856001600160a01b031614806110ac57506110ac85610aad61224a565b61111e5760405162461bcd60e51b815260206004820152603260248201527f455243313135353a207472616e736665722063616c6c6572206973206e6f742060448201527f6f776e6572206e6f7220617070726f76656400000000000000000000000000006064820152608401610be9565b61112b8585858585612254565b5050505050565b6000828152600460205260409020600101546111558161115061224a565b6124cb565b61115f838361254b565b505050565b61116c61224a565b6001600160a01b0316816001600160a01b0316146111f25760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201527f20726f6c657320666f722073656c6600000000000000000000000000000000006064820152608401610be9565b6111fc828261256d565b5050565b61122c7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a66107e261224a565b6112785760405162461bcd60e51b815260206004820152600b60248201527f6e6f74206d696e7465722e0000000000000000000000000000000000000000006044820152606401610be9565b60095460006112878583615306565b60098190556000818152600e602052604090209091506112a890858561486a565b50600d8054600181810183556000929092527fd7b6990105719101dabeb77144f2a3385c8033acd3af97e9423a695e81ad1eb5018290557f8d92b22f5855b4d8db025239efe923788e125b3fae327dbebdba3eb9dc42094790839061130d8883615306565b6113179190615384565b8686604051611329949392919061539b565b60405180910390a15050505050565b61134560006107e261224a565b6113855760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610be9565b600082815260116020908152604080832080546001600160a01b0319166001600160a01b0386169081179091559051928352849290917fdfa24b2c84f4b56930965774ade10cc0167141522e42b2863e191e8426fdc7d3910160405180910390a35050565b606081518351146114635760405162461bcd60e51b815260206004820152602960248201527f455243313135353a206163636f756e747320616e6420696473206c656e67746860448201527f206d69736d6174636800000000000000000000000000000000000000000000006064820152608401610be9565b6000835167ffffffffffffffff81111561147f5761147f614a3d565b6040519080825280602002602001820160405280156114a8578160200160208202803683370190505b50905060005b8451811015611520576114f38582815181106114cc576114cc6151dc565b60200260200101518583815181106114e6576114e66151dc565b6020026020010151610b6f565b828281518110611505576115056151dc565b6020908102919091010152611519816153d8565b90506114ae565b509392505050565b61153061224a565b6001600160a01b0316836001600160a01b03161480611556575061155683610aad61224a565b6115b55760405162461bcd60e51b815260206004820152602a60248201527f455243313135353a2063616c6c6572206973206e6f74206f776e6572206e6f726044820152691030b8383937bb32b21760b11b6064820152608401610be9565b61115f83838361258f565b6115cd60006107e261224a565b61160d5760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610be9565b61271081111561164f5760405162461bcd60e51b815260206004820152600d60248201526c313839901e1e9018981818181760991b6044820152606401610be9565b600a80547fffffffffffffffffff000000000000000000000000000000ffffffffffffffff16680100000000000000006effffffffffffffffffffffffffffff8416021790556040518181527f2440645f96173394eb0d508ef9d0c95e3ddc41c6a10ef86e547fc738df9ecce290602001610fc2565b600081815260106020526040812054806117215760405162461bcd60e51b815260206004820152601960248201527f6e6f207075626c6963206d696e7420636f6e646974696f6e2e000000000000006044820152606401610be9565b805b801561178357600084815260106020526040812060020190611746600184615384565b815260200190815260200160002060000154421061177157611769600182615384565b949350505050565b61177c600182615384565b9050611723565b5060405162461bcd60e51b815260206004820152601960248201527f6e6f20616374697665206d696e7420636f6e646974696f6e2e000000000000006044820152606401610be9565b6117d960006107e261224a565b6118195760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610be9565b600a8054821515600160b81b027fffffffffffffffff00ffffffffffffffffffffffffffffffffffffffffffffff9091161790556040517f2ebd4f59eaa9d49c5dcd06a0afa8b39bf09928fbd60111acee2f986fa485d09890610fc290831515815260200190565b61188e60006107e261224a565b6118ce5760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610be9565b60006118db8484846127dd565b90506118e78482612be6565b837f956477c5e2c5cb1058056ffe701dad74855fe3cc445bbfc11a42e384f0f5099484846040516119199291906153f3565b60405180910390a250505050565b6007546001600160a01b031660009081527f17ef568e3e12ab5b9c7254a8d58478811de00f9e6eb34345acd53bf8fd09d3ec602052604081205460ff1661196e5750600090565b6007546001600160a01b03165b905090565b60008281526005602052604081206119989083612c10565b9392505050565b6119ac60006107e261224a565b6119ec5760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610be9565b61115f600b838361486a565b611a0560006107e261224a565b611a455760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610be9565b611a508383836127dd565b50827f956477c5e2c5cb1058056ffe701dad74855fe3cc445bbfc11a42e384f0f509948383604051611a839291906153f3565b60405180910390a2505050565b6111fc611a9b61224a565b8383612c1c565b60608167ffffffffffffffff811115611abd57611abd614a3d565b604051908082528060200260200182016040528015611af057816020015b6060815260200190600190039081611adb5790505b50905060005b82811015611b9057611b6030858584818110611b1457611b146151dc565b9050602002810190611b26919061548a565b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250612d1192505050565b828281518110611b7257611b726151dc565b60200260200101819052508080611b88906153d8565b915050611af6565b5092915050565b60026006541415611bea5760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c006044820152606401610be9565b60026006556000611bfa856116c5565b600086815260106020908152604080832084845260029081018352928190208151610100810183528154815260018201549381019390935292830154908201526003820154606082015260048201546080820152600582015460a0820152600682015460c08201526007909101546001600160a01b031660e0820152909150611c87868686868686612d36565b611c92818688612fb2565b611c9d828787613197565b611ca561224a565b6001600160a01b031686837f1ab884c1a00435d9835b58198932b6c056fdc9942defb8f1e67762a8c9b2779088604051611ce191815260200190565b60405180910390a45050600160065550505050565b6060610c1582610c51565b6000818152600560205260408120610c1590613255565b611d6c6040518061010001604052806000815260200160008152602001600081526020016000815260200160008152602001600080191681526020016000815260200160006001600160a01b031681525090565b50600091825260106020908152604080842092845260029283018252928390208351610100810185528154815260018201549281019290925291820154928101929092526003810154606083015260048101546080830152600581015460a0830152600681015460c0830152600701546001600160a01b031660e082015290565b600082815260046020526040902060010154611e0b8161115061224a565b61115f838361256d565b600b8054611e22906151f2565b80601f0160208091040260200160405190810160405280929190818152602001828054611e4e906151f2565b8015611e9b5780601f10611e7057610100808354040283529160200191611e9b565b820191906000526020600020905b815481529060010190602001808311611e7e57829003601f168201915b505050505081565b6000838152601060205260408120600101548190611ec19085615306565b60008681526010602090815260408083206001600160a01b03881684526003810183528184208585528352818420548985526002909101909252909120600401548101935090915080831015611f175760001992505b50509392505050565b611f2861224a565b6001600160a01b0316856001600160a01b03161480611f4e5750611f4e85610aad61224a565b611fc05760405162461bcd60e51b815260206004820152602960248201527f455243313135353a2063616c6c6572206973206e6f74206f776e6572206e6f7260448201527f20617070726f76656400000000000000000000000000000000000000000000006064820152608401610be9565b61112b858585858561325f565b611fd561224a565b6001600160a01b0316836001600160a01b03161480611ffb5750611ffb83610aad61224a565b61205a5760405162461bcd60e51b815260206004820152602a60248201527f455243313135353a2063616c6c6572206973206e6f74206f776e6572206e6f726044820152691030b8383937bb32b21760b11b6064820152608401610be9565b61115f838383613417565b6003546000906001600160a01b0316331415612088575060131936013560601c90565b503390565b90565b3390565b60008281526004602090815260408083206001600160a01b038516845290915290205460ff166111fc5760008281526004602090815260408083206001600160a01b03851684529091529020805460ff191660011790556120f361224a565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b6000611998836001600160a01b03841661359b565b6060816121705750506040805180820190915260018152600360fc1b602082015290565b8160005b811561219a5780612184816153d8565b91506121939050600a83615370565b9150612174565b60008167ffffffffffffffff8111156121b5576121b5614a3d565b6040519080825280601f01601f1916602001820160405280156121df576020820181803683370190505b5090505b8415611769576121f4600183615384565b9150612201600a866154d1565b61220c906030615306565b60f81b818381518110612221576122216151dc565b60200101906001600160f81b031916908160001a905350612243600a86615370565b94506121e3565b600061197b612065565b81518351146122b65760405162461bcd60e51b815260206004820152602860248201527f455243313135353a2069647320616e6420616d6f756e7473206c656e677468206044820152670dad2e6dac2e8c6d60c31b6064820152608401610be9565b6001600160a01b03841661231a5760405162461bcd60e51b815260206004820152602560248201527f455243313135353a207472616e7366657220746f20746865207a65726f206164604482015264647265737360d81b6064820152608401610be9565b600061232461224a565b90506123348187878787876135ea565b60005b845181101561245d576000858281518110612354576123546151dc565b602002602001015190506000858381518110612372576123726151dc565b602090810291909101810151600084815280835260408082206001600160a01b038e1683529093529190912054909150818110156124055760405162461bcd60e51b815260206004820152602a60248201527f455243313135353a20696e73756666696369656e742062616c616e636520666f60448201526939103a3930b739b332b960b11b6064820152608401610be9565b6000838152602081815260408083206001600160a01b038e8116855292528083208585039055908b16825281208054849290612442908490615306565b9250508190555050505080612456906153d8565b9050612337565b50846001600160a01b0316866001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb87876040516124ad9291906154e5565b60405180910390a46124c3818787878787613805565b505050505050565b60008281526004602090815260408083206001600160a01b038516845290915290205460ff166111fc57612509816001600160a01b031660146139ba565b6125148360206139ba565b60405160200161252592919061550a565b60408051601f198184030181529082905262461bcd60e51b8252610be9916004016149eb565b6125558282612094565b600082815260056020526040902061115f9082612137565b6125778282613b63565b600082815260056020526040902061115f9082613c04565b6001600160a01b0383166125f15760405162461bcd60e51b815260206004820152602360248201527f455243313135353a206275726e2066726f6d20746865207a65726f206164647260448201526265737360e81b6064820152608401610be9565b80518251146126535760405162461bcd60e51b815260206004820152602860248201527f455243313135353a2069647320616e6420616d6f756e7473206c656e677468206044820152670dad2e6dac2e8c6d60c31b6064820152608401610be9565b600061265d61224a565b905061267d818560008686604051806020016040528060008152506135ea565b60005b835181101561277e57600084828151811061269d5761269d6151dc565b6020026020010151905060008483815181106126bb576126bb6151dc565b602090810291909101810151600084815280835260408082206001600160a01b038c1683529093529190912054909150818110156127475760405162461bcd60e51b8152602060048201526024808201527f455243313135353a206275726e20616d6f756e7420657863656564732062616c604482015263616e636560e01b6064820152608401610be9565b6000928352602083815260408085206001600160a01b038b1686529091529092209103905580612776816153d8565b915050612680565b5060006001600160a01b0316846001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb86866040516127cf9291906154e5565b60405180910390a450505050565b60008060005b83811015612b37578115806128135750848482818110612805576128056151dc565b905061010002016000013582105b6128855760405162461bcd60e51b815260206004820152602a60248201527f737461727454696d657374616d70206d75737420626520696e20617363656e6460448201527f696e67206f726465722e000000000000000000000000000000000000000000006064820152608401610be9565b6000858583818110612899576128996151dc565b9050610100020160200135116128f15760405162461bcd60e51b815260206004820152601c60248201527f6d6178206d696e7420737570706c792063616e6e6f7420626520302e000000006044820152606401610be9565b6000858583818110612905576129056151dc565b90506101000201606001351161295d5760405162461bcd60e51b815260206004820152601b60248201527f7175616e74697479206c696d69742063616e6e6f7420626520302e00000000006044820152606401610be9565b60405180610100016040528086868481811061297b5761297b6151dc565b9050610100020160000135815260200186868481811061299d5761299d6151dc565b90506101000201602001358152602001600081526020018686848181106129c6576129c66151dc565b905061010002016060013581526020018686848181106129e8576129e86151dc565b90506101000201608001358152602001868684818110612a0a57612a0a6151dc565b9050610100020160a001358152602001868684818110612a2c57612a2c6151dc565b9050610100020160c001358152602001868684818110612a4e57612a4e6151dc565b9050610100020160e0016020810190612a6791906149fe565b6001600160a01b039081169091526000888152601060209081526040808320888452600290810183529281902085518155918501516001808401919091559085015192820192909255606084015160038201556080840151600482015560a0840151600582015560c0840151600682015560e090930151600790930180546001600160a01b03191693909216929092179055612b039084615306565b9250848482818110612b1757612b176151dc565b905061010002016000013591508080612b2f906153d8565b9150506127e3565b5060008581526010602052604090205480831015612bcb57825b81811015612bc95760008781526010602090815260408083208484526002908101909252822082815560018082018490559181018390556003810183905560048101839055600581018390556006810192909255600790910180546001600160a01b0319169055612bc29082615306565b9050612b51565b505b50506000938452601060205260409093208390555090919050565b60008281526010602052604081206001018054839290612c07908490615306565b90915550505050565b60006119988383613c19565b816001600160a01b0316836001600160a01b03161415612ca45760405162461bcd60e51b815260206004820152602960248201527f455243313135353a2073657474696e6720617070726f76616c2073746174757360448201527f20666f722073656c6600000000000000000000000000000000000000000000006064820152608401610be9565b6001600160a01b03838116600081815260016020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b6060611998838360405180606001604052806027815260200161576e60279139613c43565b600085118015612d4a575080606001518511155b612d965760405162461bcd60e51b815260206004820152601960248201527f696e76616c6964207175616e7469747920636c61696d65642e000000000000006044820152606401610be9565b8060200151858260400151612dab9190615306565b1115612df95760405162461bcd60e51b815260206004820152601760248201527f657863656564206d6178206d696e7420737570706c792e0000000000000000006044820152606401610be9565b600086815260106020526040812060010154612e159084615306565b60008881526010602052604081209192509060030181612e3361224a565b6001600160a01b03168152602080820192909252604090810160009081208582529092528120549150612e698986610af661224a565b9050811580612e785750804210155b612ec45760405162461bcd60e51b815260206004820152601160248201527f63616e6e6f7420636c61696d207965742e0000000000000000000000000000006044820152606401610be9565b60a084015115612fa7576000612ed861224a565b604051602001612f00919060609190911b6bffffffffffffffffffffffff1916815260140190565b604051602081830303815290604052805190602001209050612f5988888080602002602001604051908101604052809392919081815260200183836020028082843760009201919091525050505060a087015183613d2e565b612fa55760405162461bcd60e51b815260206004820152601160248201527f6e6f7420696e2077686974656c6973742e0000000000000000000000000000006044820152606401610be9565b505b505050505050505050565b60008360c0015111612fc357505050565b60008360c0015183612fd5919061533b565b600a5490915060009061271090613009906801000000000000000090046effffffffffffffffffffffffffffff168461533b565b6130139190615370565b60e08601519091506001600160a01b031673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee14156130935781341461308e5760405162461bcd60e51b815260206004820152601660248201527f6d7573742073656e6420746f74616c2070726963652e000000000000000000006044820152606401610be9565b6130a9565b6130a961309e61224a565b8660e0015184613d44565b61313a8560e001516130b961224a565b600c5460405163f2aab4b360e01b81523060048201526001600160a01b039091169063f2aab4b39060240160206040518083038186803b1580156130fc57600080fd5b505afa158015613110573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190613134919061531e565b84613ec0565b60008381526011602052604090205460e08601516001600160a01b03909116906124c39061316661224a565b6001600160a01b0384161561317b5783613188565b6008546001600160a01b03165b6131928688615384565b613ec0565b6000828152601060209081526040808320868452600290810190925282200180548392906131c6908490615306565b90915550506000828152601060205260408120600101546131e79085615306565b600084815260106020526040812091925042916003019061320661224a565b6001600160a01b031681526020808201929092526040908101600090812085825290925290205561324f61323861224a565b84846040518060200160405280600081525061409e565b50505050565b6000610c15825490565b6001600160a01b0384166132c35760405162461bcd60e51b815260206004820152602560248201527f455243313135353a207472616e7366657220746f20746865207a65726f206164604482015264647265737360d81b6064820152608401610be9565b60006132cd61224a565b90506132ed8187876132de886141aa565b6132e7886141aa565b876135ea565b6000848152602081815260408083206001600160a01b038a168452909152902054838110156133715760405162461bcd60e51b815260206004820152602a60248201527f455243313135353a20696e73756666696369656e742062616c616e636520666f60448201526939103a3930b739b332b960b11b6064820152608401610be9565b6000858152602081815260408083206001600160a01b038b81168552925280832087850390559088168252812080548692906133ae908490615306565b909155505060408051868152602081018690526001600160a01b03808916928a821692918616917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a461340e8288888888886141f5565b50505050505050565b6001600160a01b0383166134795760405162461bcd60e51b815260206004820152602360248201527f455243313135353a206275726e2066726f6d20746865207a65726f206164647260448201526265737360e81b6064820152608401610be9565b600061348361224a565b90506134b381856000613495876141aa565b61349e876141aa565b604051806020016040528060008152506135ea565b6000838152602081815260408083206001600160a01b0388168452909152902054828110156135305760405162461bcd60e51b8152602060048201526024808201527f455243313135353a206275726e20616d6f756e7420657863656564732062616c604482015263616e636560e01b6064820152608401610be9565b6000848152602081815260408083206001600160a01b03898116808652918452828520888703905582518981529384018890529092908616917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a45050505050565b60008181526001830160205260408120546135e257508154600181810184556000848152602080822090930184905584548482528286019093526040902091909155610c15565b506000610c15565b600a54600160b81b900460ff16801561360b57506001600160a01b03851615155b801561361f57506001600160a01b03841615155b156136f9576001600160a01b03851660009081527f1c88b5fd2b55b5abb48725d2d1819fee67dc026403dc9aa4432aac630558b5e8602052604090205460ff16806136a157506001600160a01b03841660009081527f1c88b5fd2b55b5abb48725d2d1819fee67dc026403dc9aa4432aac630558b5e8602052604090205460ff165b6136f95760405162461bcd60e51b8152602060048201526024808201527f7265737472696374656420746f205452414e534645525f524f4c4520686f6c6460448201526332b9399760e11b6064820152608401610be9565b6001600160a01b0385166137805760005b835181101561377e57828181518110613725576137256151dc565b6020026020010151600f6000868481518110613743576137436151dc565b6020026020010151815260200190815260200160002060008282546137689190615306565b909155506137779050816153d8565b905061370a565b505b6001600160a01b0384166124c35760005b835181101561340e578281815181106137ac576137ac6151dc565b6020026020010151600f60008684815181106137ca576137ca6151dc565b6020026020010151815260200190815260200160002060008282546137ef9190615384565b909155506137fe9050816153d8565b9050613791565b6001600160a01b0384163b156124c35760405163bc197c8160e01b81526001600160a01b0385169063bc197c8190613849908990899088908890889060040161558b565b602060405180830381600087803b15801561386357600080fd5b505af1925050508015613893575060408051601f3d908101601f19168201909252613890918101906155e9565b60015b6139495761389f615606565b806308c379a014156138d957506138b4615621565b806138bf57506138db565b8060405162461bcd60e51b8152600401610be991906149eb565b505b60405162461bcd60e51b815260206004820152603460248201527f455243313135353a207472616e7366657220746f206e6f6e204552433131353560448201527f526563656976657220696d706c656d656e7465720000000000000000000000006064820152608401610be9565b6001600160e01b0319811663bc197c8160e01b1461340e5760405162461bcd60e51b815260206004820152602860248201527f455243313135353a204552433131353552656365697665722072656a656374656044820152676420746f6b656e7360c01b6064820152608401610be9565b606060006139c983600261533b565b6139d4906002615306565b67ffffffffffffffff8111156139ec576139ec614a3d565b6040519080825280601f01601f191660200182016040528015613a16576020820181803683370190505b509050600360fc1b81600081518110613a3157613a316151dc565b60200101906001600160f81b031916908160001a905350600f60fb1b81600181518110613a6057613a606151dc565b60200101906001600160f81b031916908160001a9053506000613a8484600261533b565b613a8f906001615306565b90505b6001811115613b14577f303132333435363738396162636465660000000000000000000000000000000085600f1660108110613ad057613ad06151dc565b1a60f81b828281518110613ae657613ae66151dc565b60200101906001600160f81b031916908160001a90535060049490941c93613b0d816156ab565b9050613a92565b5083156119985760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610be9565b60008281526004602090815260408083206001600160a01b038516845290915290205460ff16156111fc5760008281526004602090815260408083206001600160a01b03851684529091529020805460ff19169055613bc061224a565b6001600160a01b0316816001600160a01b0316837ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b60405160405180910390a45050565b6000611998836001600160a01b038416614300565b6000826000018281548110613c3057613c306151dc565b9060005260206000200154905092915050565b6060833b613cb95760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e747261637400000000000000000000000000000000000000000000000000006064820152608401610be9565b600080856001600160a01b031685604051613cd491906156c2565b600060405180830381855af49150503d8060008114613d0f576040519150601f19603f3d011682016040523d82523d6000602084013e613d14565b606091505b5091509150613d248282866143f3565b9695505050505050565b600082613d3b858461442c565b14949350505050565b6040516370a0823160e01b81526001600160a01b0384811660048301528291908416906370a082319060240160206040518083038186803b158015613d8857600080fd5b505afa158015613d9c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190613dc091906156de565b10158015613e4e5750604051636eb1769f60e11b81526001600160a01b03848116600483015230602483015282919084169063dd62ed3e9060440160206040518083038186803b158015613e1357600080fd5b505afa158015613e27573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190613e4b91906156de565b10155b61115f5760405162461bcd60e51b815260206004820152602b60248201527f696e73756666696369656e742063757272656e63792062616c616e6365206f7260448201527f20616c6c6f77616e63652e0000000000000000000000000000000000000000006064820152608401610be9565b80613eca5761324f565b6001600160a01b03841673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee1415614092576001600160a01b038316301415613f8957604051632e1a7d4d60e01b8152600481018290527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031690632e1a7d4d90602401600060405180830381600087803b158015613f6257600080fd5b505af1158015613f76573d6000803e3d6000fd5b50505050613f8482826144d0565b61324f565b6001600160a01b0382163014156140885734811461400f5760405162461bcd60e51b815260206004820152602d60248201527f6e617469766520746f6b656e2076616c756520646f6573206e6f74206d61746360448201527f682062696420616d6f756e742e000000000000000000000000000000000000006064820152608401610be9565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663d0e30db0826040518263ffffffff1660e01b81526004016000604051808303818588803b15801561406a57600080fd5b505af115801561407e573d6000803e3d6000fd5b505050505061324f565b613f8482826144d0565b61324f848484846145c7565b6001600160a01b0384166140fe5760405162461bcd60e51b815260206004820152602160248201527f455243313135353a206d696e7420746f20746865207a65726f206164647265736044820152607360f81b6064820152608401610be9565b600061410861224a565b905061411a816000876132de886141aa565b6000848152602081815260408083206001600160a01b03891684529091528120805485929061414a908490615306565b909155505060408051858152602081018590526001600160a01b0380881692600092918516917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a461112b816000878787876141f5565b604080516001808252818301909252606091600091906020808301908036833701905050905082816000815181106141e4576141e46151dc565b602090810291909101015292915050565b6001600160a01b0384163b156124c35760405163f23a6e6160e01b81526001600160a01b0385169063f23a6e619061423990899089908890889088906004016156f7565b602060405180830381600087803b15801561425357600080fd5b505af1925050508015614283575060408051601f3d908101601f19168201909252614280918101906155e9565b60015b61428f5761389f615606565b6001600160e01b0319811663f23a6e6160e01b1461340e5760405162461bcd60e51b815260206004820152602860248201527f455243313135353a204552433131353552656365697665722072656a656374656044820152676420746f6b656e7360c01b6064820152608401610be9565b600081815260018301602052604081205480156143e9576000614324600183615384565b855490915060009061433890600190615384565b905081811461439d576000866000018281548110614358576143586151dc565b906000526020600020015490508087600001848154811061437b5761437b6151dc565b6000918252602080832090910192909255918252600188019052604090208390555b85548690806143ae576143ae61573a565b600190038181906000526020600020016000905590558560010160008681526020019081526020016000206000905560019350505050610c15565b6000915050610c15565b60608315614402575081611998565b8251156144125782518084602001fd5b8160405162461bcd60e51b8152600401610be991906149eb565b600081815b845181101561152057600085828151811061444e5761444e6151dc565b602002602001015190508083116144905760408051602081018590529081018290526060016040516020818303038152906040528051906020012092506144bd565b60408051602081018390529081018490526060016040516020818303038152906040528051906020012092505b50806144c8816153d8565b915050614431565b6000826001600160a01b03168260405160006040518083038185875af1925050503d806000811461451d576040519150601f19603f3d011682016040523d82523d6000602084013e614522565b606091505b505090508061115f577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663d0e30db0836040518263ffffffff1660e01b81526004016000604051808303818588803b15801561458657600080fd5b505af115801561459a573d6000803e3d6000fd5b505050505061115f7f00000000000000000000000000000000000000000000000000000000000000003085855b816001600160a01b0316836001600160a01b031614156145e65761324f565b6040516370a0823160e01b81526001600160a01b038381166004830152600091908616906370a082319060240160206040518083038186803b15801561462b57600080fd5b505afa15801561463f573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061466391906156de565b905060006001600160a01b0385163014614706576040516323b872dd60e01b81526001600160a01b0386811660048301528581166024830152604482018590528716906323b872dd90606401602060405180830381600087803b1580156146c957600080fd5b505af11580156146dd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906147019190615750565b614788565b60405163a9059cbb60e01b81526001600160a01b0385811660048301526024820185905287169063a9059cbb90604401602060405180830381600087803b15801561475057600080fd5b505af1158015614764573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906147889190615750565b6040516370a0823160e01b81526001600160a01b0386811660048301529192506000918816906370a082319060240160206040518083038186803b1580156147cf57600080fd5b505afa1580156147e3573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061480791906156de565b905081801561481e575061481b8484615306565b81145b61340e5760405162461bcd60e51b815260206004820152601c60248201527f6661696c656420746f207472616e736665722063757272656e63792e000000006044820152606401610be9565b828054614876906151f2565b90600052602060002090601f01602090048101928261489857600085556148de565b82601f106148b15782800160ff198235161785556148de565b828001600101855582156148de579182015b828111156148de5782358255916020019190600101906148c3565b506148ea9291506148ee565b5090565b5b808211156148ea57600081556001016148ef565b6001600160a01b038116811461491857600080fd5b50565b6000806040838503121561492e57600080fd5b823561493981614903565b946020939093013593505050565b6001600160e01b03198116811461491857600080fd5b60006020828403121561496f57600080fd5b813561199881614947565b60006020828403121561498c57600080fd5b5035919050565b60005b838110156149ae578181015183820152602001614996565b8381111561324f5750506000910152565b600081518084526149d7816020860160208601614993565b601f01601f19169290920160200192915050565b60208152600061199860208301846149bf565b600060208284031215614a1057600080fd5b813561199881614903565b60008060408385031215614a2e57600080fd5b50508035926020909101359150565b634e487b7160e01b600052604160045260246000fd5b601f8201601f1916810167ffffffffffffffff81118282101715614a7957614a79614a3d565b6040525050565b600067ffffffffffffffff821115614a9a57614a9a614a3d565b5060051b60200190565b600082601f830112614ab557600080fd5b81356020614ac282614a80565b604051614acf8282614a53565b83815260059390931b8501820192828101915086841115614aef57600080fd5b8286015b84811015614b0a5780358352918301918301614af3565b509695505050505050565b600082601f830112614b2657600080fd5b813567ffffffffffffffff811115614b4057614b40614a3d565b604051614b57601f8301601f191660200182614a53565b818152846020838601011115614b6c57600080fd5b816020850160208301376000918101602001919091529392505050565b600080600080600060a08688031215614ba157600080fd5b8535614bac81614903565b94506020860135614bbc81614903565b9350604086013567ffffffffffffffff80821115614bd957600080fd5b614be589838a01614aa4565b94506060880135915080821115614bfb57600080fd5b614c0789838a01614aa4565b93506080880135915080821115614c1d57600080fd5b50614c2a88828901614b15565b9150509295509295909350565b60008060408385031215614c4a57600080fd5b823591506020830135614c5c81614903565b809150509250929050565b60008083601f840112614c7957600080fd5b50813567ffffffffffffffff811115614c9157600080fd5b602083019150836020828501011115614ca957600080fd5b9250929050565b600080600060408486031215614cc557600080fd5b83359250602084013567ffffffffffffffff811115614ce357600080fd5b614cef86828701614c67565b9497909650939450505050565b60008060408385031215614d0f57600080fd5b823567ffffffffffffffff80821115614d2757600080fd5b818501915085601f830112614d3b57600080fd5b81356020614d4882614a80565b604051614d558282614a53565b83815260059390931b8501820192828101915089841115614d7557600080fd5b948201945b83861015614d9c578535614d8d81614903565b82529482019490820190614d7a565b96505086013592505080821115614db257600080fd5b50614dbf85828601614aa4565b9150509250929050565b600081518084526020808501945080840160005b83811015614df957815187529582019590820190600101614ddd565b509495945050505050565b6020815260006119986020830184614dc9565b600080600060608486031215614e2c57600080fd5b8335614e3781614903565b9250602084013567ffffffffffffffff80821115614e5457600080fd5b614e6087838801614aa4565b93506040860135915080821115614e7657600080fd5b50614e8386828701614aa4565b9150509250925092565b801515811461491857600080fd5b600060208284031215614ead57600080fd5b813561199881614e8d565b600080600060408486031215614ecd57600080fd5b83359250602084013567ffffffffffffffff80821115614eec57600080fd5b818601915086601f830112614f0057600080fd5b813581811115614f0f57600080fd5b8760208260081b8501011115614f2457600080fd5b6020830194508093505050509250925092565b60008060208385031215614f4a57600080fd5b823567ffffffffffffffff811115614f6157600080fd5b614f6d85828601614c67565b90969095509350505050565b60008060408385031215614f8c57600080fd5b8235614f9781614903565b91506020830135614c5c81614e8d565b60008083601f840112614fb957600080fd5b50813567ffffffffffffffff811115614fd157600080fd5b6020830191508360208260051b8501011115614ca957600080fd5b60008060208385031215614fff57600080fd5b823567ffffffffffffffff81111561501657600080fd5b614f6d85828601614fa7565b6000602080830181845280855180835260408601915060408160051b870101925083870160005b8281101561507757603f198886030184526150658583516149bf565b94509285019290850190600101615049565b5092979650505050505050565b6000806000806060858703121561509a57600080fd5b8435935060208501359250604085013567ffffffffffffffff8111156150bf57600080fd5b6150cb87828801614fa7565b95989497509550505050565b600080604083850312156150ea57600080fd5b82356150f581614903565b91506020830135614c5c81614903565b60008060006060848603121561511a57600080fd5b8335925060208401359150604084013561513381614903565b809150509250925092565b600080600080600060a0868803121561515657600080fd5b853561516181614903565b9450602086013561517181614903565b93506040860135925060608601359150608086013567ffffffffffffffff81111561519b57600080fd5b614c2a88828901614b15565b6000806000606084860312156151bc57600080fd5b83356151c781614903565b95602085013595506040909401359392505050565b634e487b7160e01b600052603260045260246000fd5b600181811c9082168061520657607f821691505b6020821081141561522757634e487b7160e01b600052602260045260246000fd5b50919050565b6000815161523f818560208601614993565b9290920192915050565b600080845481600182811c91508083168061526557607f831692505b602080841082141561528557634e487b7160e01b86526022600452602486fd5b81801561529957600181146152aa576152d7565b60ff198616895284890196506152d7565b60008b81526020902060005b868110156152cf5781548b8201529085019083016152b6565b505084890196505b5050505050506152e7818561522d565b95945050505050565b634e487b7160e01b600052601160045260246000fd5b60008219821115615319576153196152f0565b500190565b60006020828403121561533057600080fd5b815161199881614903565b6000816000190483118215151615615355576153556152f0565b500290565b634e487b7160e01b600052601260045260246000fd5b60008261537f5761537f61535a565b500490565b600082821015615396576153966152f0565b500390565b84815283602082015260606040820152816060820152818360808301376000818301608090810191909152601f909201601f191601019392505050565b60006000198214156153ec576153ec6152f0565b5060010190565b6020808252818101839052600090604080840186845b8781101561547d578135835284820135858401528382013584840152606080830135908401526080808301359084015260a0808301359084015260c0808301359084015260e08083013561545c81614903565b6001600160a01b031690840152610100928301929190910190600101615409565b5090979650505050505050565b6000808335601e198436030181126154a157600080fd5b83018035915067ffffffffffffffff8211156154bc57600080fd5b602001915036819003821315614ca957600080fd5b6000826154e0576154e061535a565b500690565b6040815260006154f86040830185614dc9565b82810360208401526152e78185614dc9565b7f416363657373436f6e74726f6c3a206163636f756e7420000000000000000000815260008351615542816017850160208801614993565b7f206973206d697373696e6720726f6c6520000000000000000000000000000000601791840191820152835161557f816028840160208801614993565b01602801949350505050565b60006001600160a01b03808816835280871660208401525060a060408301526155b760a0830186614dc9565b82810360608401526155c98186614dc9565b905082810360808401526155dd81856149bf565b98975050505050505050565b6000602082840312156155fb57600080fd5b815161199881614947565b600060033d111561208d5760046000803e5060005160e01c90565b600060443d101561562f5790565b6040516003193d81016004833e81513d67ffffffffffffffff816024840111818411171561565f57505050505090565b82850191508151818111156156775750505050505090565b843d87010160208285010111156156915750505050505090565b6156a060208286010187614a53565b509095945050505050565b6000816156ba576156ba6152f0565b506000190190565b600082516156d4818460208701614993565b9190910192915050565b6000602082840312156156f057600080fd5b5051919050565b60006001600160a01b03808816835280871660208401525084604083015283606083015260a0608083015261572f60a08301846149bf565b979650505050505050565b634e487b7160e01b600052603160045260246000fd5b60006020828403121561576257600080fd5b815161199881614e8d56fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a164736f6c6343000809000a";
}
