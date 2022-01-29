/* tslint:disable */
/* eslint-disable */

export class LazyMintERC721__factory {
  static readonly abi = [
    {
      inputs: [
        {
          internalType: "string",
          name: "_name",
          type: "string",
        },
        {
          internalType: "string",
          name: "_symbol",
          type: "string",
        },
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
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "approved",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
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
          internalType: "address",
          name: "claimer",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "startTokenId",
          type: "uint256",
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
          internalType: "struct ILazyMintERC721.ClaimCondition[]",
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
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "Transfer",
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
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
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
          internalType: "uint256",
          name: "tokenId",
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
      inputs: [],
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
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "getApproved",
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
          internalType: "struct ILazyMintERC721.ClaimCondition",
          name: "mintCondition",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
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
          name: "owner",
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
      name: "name",
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
      name: "nextTokenIdToClaim",
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
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "ownerOf",
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
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
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
          name: "tokenId",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "_data",
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
          internalType: "struct ILazyMintERC721.ClaimCondition[]",
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
      inputs: [],
      name: "symbol",
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
      inputs: [
        {
          internalType: "uint256",
          name: "index",
          type: "uint256",
        },
      ],
      name: "tokenByIndex",
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
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "index",
          type: "uint256",
        },
      ],
      name: "tokenOfOwnerByIndex",
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
      ],
      name: "tokenURI",
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
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "transferFrom",
      outputs: [],
      stateMutability: "nonpayable",
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
          internalType: "struct ILazyMintERC721.ClaimCondition[]",
          name: "_conditions",
          type: "tuple[]",
        },
      ],
      name: "updateClaimConditions",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  static readonly bytecode =
    "0x60a06040523480156200001157600080fd5b50604051620056be380380620056be833981016040819052620000349162000502565b84898981600090805190602001906200004f9291906200035a565b508051620000659060019060208401906200035a565b5050600a80546001600160a01b03199081166001600160a01b03948516179091556001600d556014805482168a8516179055868316608052600f805490911692861692909217909155508651620000c49060139060208a01906200035a565b50601280546001600160781b03831668010000000000000000026001600160b81b03199091166001600160401b0385161717905560006200010462000196565b600e80546001600160a01b0319166001600160a01b03831617905590506200012e600082620001b2565b6200015a7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a682620001b2565b620001867f8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c82620001b2565b5050505050505050505062000641565b6000620001ad620001c260201b6200214f1760201c565b905090565b620001be8282620001fb565b5050565b600a546000906001600160a01b0316331415620001e6575060131936013560601c90565b620001ad6200023e60201b620021771760201c565b6200021282826200024260201b6200217b1760201c565b6000828152600c60209081526040909120620002399183906200221e620002e8821b17901c565b505050565b3390565b6000828152600b602090815260408083206001600160a01b038516845290915290205460ff16620001be576000828152600b602090815260408083206001600160a01b03851684529091529020805460ff19166001179055620002a462000196565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b6000620002ff836001600160a01b03841662000308565b90505b92915050565b6000818152600183016020526040812054620003515750815460018181018455600084815260208082209093018490558454848252828601909352604090209190915562000302565b50600062000302565b828054620003689062000604565b90600052602060002090601f0160209004810192826200038c5760008555620003d7565b82601f10620003a757805160ff1916838001178555620003d7565b82800160010185558215620003d7579182015b82811115620003d7578251825591602001919060010190620003ba565b50620003e5929150620003e9565b5090565b5b80821115620003e55760008155600101620003ea565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200042857600080fd5b81516001600160401b038082111562000445576200044562000400565b604051601f8301601f19908116603f0116810190828211818310171562000470576200047062000400565b816040528381526020925086838588010111156200048d57600080fd5b600091505b83821015620004b1578582018301518183018401529082019062000492565b83821115620004c35760008385830101525b9695505050505050565b80516001600160a01b0381168114620004e557600080fd5b919050565b80516001600160801b0381168114620004e557600080fd5b60008060008060008060008060006101208a8c0312156200052257600080fd5b89516001600160401b03808211156200053a57600080fd5b620005488d838e0162000416565b9a5060208c01519150808211156200055f57600080fd5b6200056d8d838e0162000416565b995060408c01519150808211156200058457600080fd5b50620005938c828d0162000416565b975050620005a460608b01620004cd565b9550620005b460808b01620004cd565b9450620005c460a08b01620004cd565b9350620005d460c08b01620004cd565b9250620005e460e08b01620004ea565b9150620005f56101008b01620004ea565b90509295985092959850929598565b600181811c908216806200061957607f821691505b602082108114156200063b57634e487b7160e01b600052602260045260246000fd5b50919050565b6080516150456200067960003960008181610b44015281816137500152818161384b01528181613f410152613fb801526150456000f3fe60806040526004361061034a5760003560e01c8063572b6c05116101bb578063a22cb465116100f7578063ca15c87311610095578063d547741f1161006f578063d547741f14610ab4578063e8a3d48514610ad4578063e985e9c514610ae9578063f9ea29cb14610b3257600080fd5b8063ca15c87314610a4b578063ceb4aff314610a6b578063d539139314610a8057600080fd5b8063acd083f8116100d1578063acd083f8146109bb578063b88d4fde146109d1578063c63adb2b146109f1578063c87b56dd14610a2b57600080fd5b8063a22cb4651461094e578063a3d85fb11461096e578063ac9650d81461098e57600080fd5b80638ba448c21161016457806391d148541161013e57806391d14854146108be578063938e3d7b1461090457806395d89b4114610924578063a217fddf1461093957600080fd5b80638ba448c2146108695780638da5cb5b146108895780639010d07c1461089e57600080fd5b806370a082311161019557806370a082311461080857806372c27b62146108285780638423df791461084857600080fd5b8063572b6c05146107895780636352211e146107b857806366613463146107d857600080fd5b806324a9d8531161028a57806336568abe1161023357806342842e0e1161020d57806342842e0e1461070957806342966c681461072957806347158264146107495780634f6ccce71461076957600080fd5b806336568abe146106495780633707d9dc146106695780633b1475a7146106f357600080fd5b80632f52ebb7116102645780632f52ebb7146105f65780632f745c591461060957806333fd29991461062957600080fd5b806324a9d853146105435780632a55205a146105975780632f2ff15d146105d657600080fd5b806318160ddd116102f7578063206b60f9116102d1578063206b60f91461049f57806323b872dd146104d3578063246b436b146104f3578063248a9ca31461051357600080fd5b806318160ddd146104405780631f72d8311461045f5780632053a5cc1461047f57600080fd5b8063095ea7b311610328578063095ea7b3146103de57806313af4035146104005780631490ee761461042057600080fd5b806301ffc9a71461034f57806306fdde0314610384578063081812fc146103a6575b600080fd5b34801561035b57600080fd5b5061036f61036a366004614642565b610b66565b60405190151581526020015b60405180910390f35b34801561039057600080fd5b50610399610b92565b60405161037b91906146b7565b3480156103b257600080fd5b506103c66103c13660046146ca565b610c24565b6040516001600160a01b03909116815260200161037b565b3480156103ea57600080fd5b506103fe6103f93660046146f8565b610cbe565b005b34801561040c57600080fd5b506103fe61041b366004614724565b610de6565b34801561042c57600080fd5b506103fe61043b366004614724565b610f1c565b34801561044c57600080fd5b506008545b60405190815260200161037b565b34801561046b57600080fd5b506103fe61047a3660046146ca565b610fb3565b34801561048b57600080fd5b506103fe61049a366004614741565b611096565b3480156104ab57600080fd5b506104517f8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c81565b3480156104df57600080fd5b506103fe6104ee3660046147b6565b61111f565b3480156104ff57600080fd5b50600f546103c6906001600160a01b031681565b34801561051f57600080fd5b5061045161052e3660046146ca565b6000908152600b602052604090206001015490565b34801561054f57600080fd5b50601254610577906801000000000000000090046effffffffffffffffffffffffffffff1681565b6040516effffffffffffffffffffffffffffff909116815260200161037b565b3480156105a357600080fd5b506105b76105b23660046147f7565b6111ad565b604080516001600160a01b03909316835260208301919091520161037b565b3480156105e257600080fd5b506103fe6105f1366004614819565b61125e565b6103fe610604366004614895565b61128b565b34801561061557600080fd5b506104516106243660046146f8565b6113e8565b34801561063557600080fd5b50610451610644366004614819565b611490565b34801561065557600080fd5b506103fe610664366004614819565b6114f2565b34801561067557600080fd5b506106896106843660046146ca565b61158e565b60405161037b9190600061010082019050825182526020830151602083015260408301516040830152606083015160608301526080830151608083015260a083015160a083015260c083015160c08301526001600160a01b0360e08401511660e083015292915050565b3480156106ff57600080fd5b5061045160105481565b34801561071557600080fd5b506103fe6107243660046147b6565b611659565b34801561073557600080fd5b506103fe6107443660046146ca565b611674565b34801561075557600080fd5b506103fe610764366004614923565b6116fd565b34801561077557600080fd5b506104516107843660046146ca565b611835565b34801561079557600080fd5b5061036f6107a4366004614724565b600a546001600160a01b0391821691161490565b3480156107c457600080fd5b506103c66107d33660046146ca565b6118d9565b3480156107e457600080fd5b506017546018546107f3919082565b6040805192835260208301919091520161037b565b34801561081457600080fd5b50610451610823366004614724565b611964565b34801561083457600080fd5b506103fe6108433660046146ca565b6119fe565b34801561085457600080fd5b5060125461036f90600160b81b900460ff1681565b34801561087557600080fd5b506103fe610884366004614970565b611b03565b34801561089557600080fd5b506103c6611bb8565b3480156108aa57600080fd5b506103c66108b93660046147f7565b611c11565b3480156108ca57600080fd5b5061036f6108d9366004614819565b6000918252600b602090815260408084206001600160a01b0393909316845291905290205460ff1690565b34801561091057600080fd5b506103fe61091f36600461498d565b611c30565b34801561093057600080fd5b50610399611c89565b34801561094557600080fd5b50610451600081565b34801561095a57600080fd5b506103fe6109693660046149cf565b611c98565b34801561097a57600080fd5b506103fe610989366004614741565b611caa565b34801561099a57600080fd5b506109ae6109a93660046149fd565b611d4c565b60405161037b9190614a33565b3480156109c757600080fd5b5061045160115481565b3480156109dd57600080fd5b506103fe6109ec366004614aab565b611e41565b3480156109fd57600080fd5b50601254610a129067ffffffffffffffff1681565b60405167ffffffffffffffff909116815260200161037b565b348015610a3757600080fd5b50610399610a463660046146ca565b611ed6565b348015610a5757600080fd5b50610451610a663660046146ca565b611f93565b348015610a7757600080fd5b50610451611faa565b348015610a8c57600080fd5b506104517f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a681565b348015610ac057600080fd5b506103fe610acf366004614819565b612099565b348015610ae057600080fd5b506103996120c1565b348015610af557600080fd5b5061036f610b04366004614b8b565b6001600160a01b03918216600090815260056020908152604080832093909416825291909152205460ff1690565b348015610b3e57600080fd5b506103c67f000000000000000000000000000000000000000000000000000000000000000081565b6000610b7182612233565b80610b8c57506001600160e01b0319821663152a902d60e11b145b92915050565b606060008054610ba190614bb9565b80601f0160208091040260200160405190810160405280929190818152602001828054610bcd90614bb9565b8015610c1a5780601f10610bef57610100808354040283529160200191610c1a565b820191906000526020600020905b815481529060010190602001808311610bfd57829003601f168201915b5050505050905090565b6000818152600260205260408120546001600160a01b0316610ca25760405162461bcd60e51b815260206004820152602c60248201527f4552433732313a20617070726f76656420717565727920666f72206e6f6e657860448201526b34b9ba32b73a103a37b5b2b760a11b60648201526084015b60405180910390fd5b506000908152600460205260409020546001600160a01b031690565b6000610cc9826118d9565b9050806001600160a01b0316836001600160a01b03161415610d375760405162461bcd60e51b815260206004820152602160248201527f4552433732313a20617070726f76616c20746f2063757272656e74206f776e656044820152603960f91b6064820152608401610c99565b806001600160a01b0316610d49612258565b6001600160a01b03161480610d655750610d6581610b04612258565b610dd75760405162461bcd60e51b815260206004820152603860248201527f4552433732313a20617070726f76652063616c6c6572206973206e6f74206f7760448201527f6e6572206e6f7220617070726f76656420666f7220616c6c00000000000000006064820152608401610c99565b610de18383612262565b505050565b610df360006108d9612258565b610e335760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610c99565b6001600160a01b03811660009081527fdf7de25b7f1fd6d0b5205f0e18f1f35bd7b8d84cce336588d184533ce43a6f76602052604090205460ff16610eba5760405162461bcd60e51b815260206004820152601b60248201527f6e6577206f776e6572206e6f74206d6f64756c652061646d696e2e00000000006044820152606401610c99565b600e80546001600160a01b038381166001600160a01b031983168117909355604080519190921680825260208201939093527f70aea8d848e8a90fb7661b227dc522eb6395c3dac71b63cb59edd5c9899b236491015b60405180910390a15050565b610f2960006108d9612258565b610f695760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610c99565b600f80546001600160a01b0319166001600160a01b0383169081179091556040517f7469c47fe13b9fc961c218a4b283151f80fc15e3a95e1d1b95aeace021f3d0cc90600090a250565b610fc060006108d9612258565b6110005760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610c99565b6127108111156110425760405162461bcd60e51b815260206004820152600d60248201526c313839901e1e9018981818181760991b6044820152606401610c99565b6012805467ffffffffffffffff191667ffffffffffffffff83161790556040518181527f244ea8d7627f5a08f4299862bd5a45752842c183aee5b0fb0d1e4887bfa605b3906020015b60405180910390a150565b6110a360006108d9612258565b6110e35760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610c99565b6110ed82826122d0565b507fcf5c78d906c121f34b51400d28b5f2ea0670bb6392c731a1abf62f32ca9251188282604051610f10929190614bf4565b61113061112a612258565b8261269f565b6111a25760405162461bcd60e51b815260206004820152603160248201527f4552433732313a207472616e736665722063616c6c6572206973206e6f74206f60448201527f776e6572206e6f7220617070726f7665640000000000000000000000000000006064820152608401610c99565b610de1838383612796565b60145460405163f2aab4b360e01b815230600482015260009182916001600160a01b039091169063f2aab4b39060240160206040518083038186803b1580156111f557600080fd5b505afa158015611209573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061122d9190614c8b565b6012549092506127109061124b9067ffffffffffffffff1685614cbe565b6112559190614cf3565b90509250929050565b6000828152600b60205260409020600101546112818161127c612258565b612955565b610de183836129d5565b6002600d5414156112de5760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c006044820152606401610c99565b6002600d5560115460006112f0611faa565b600081815260196020908152604091829020825161010081018452815481526001820154928101929092526002810154928201929092526003820154606082015260048201546080820152600582015460a0820152600682015460c08201526007909101546001600160a01b031660e082015290915061137386868685856129f7565b61137d8187612c56565b6113878287612e05565b61138f612258565b6001600160a01b0316827f54618f0be6934007b2376eeb3722d19641442c3dd04ab3e13e413c311fa7a41785896040516113d3929190918252602082015260400190565b60405180910390a350506001600d5550505050565b60006113f383611964565b82106114675760405162461bcd60e51b815260206004820152602b60248201527f455243373231456e756d657261626c653a206f776e657220696e646578206f7560448201527f74206f6620626f756e64730000000000000000000000000000000000000000006064820152608401610c99565b506001600160a01b03919091166000908152600660209081526040808320938352929052205490565b60185460009081906114a29085614d07565b6001600160a01b0384166000908152601a6020908152604080832084845282528083205488845260199092529091206004015481019350909150808310156114ea5760001992505b505092915050565b6114fa612258565b6001600160a01b0316816001600160a01b0316146115805760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201527f20726f6c657320666f722073656c6600000000000000000000000000000000006064820152608401610c99565b61158a8282612eba565b5050565b6115e26040518061010001604052806000815260200160008152602001600081526020016000815260200160008152602001600080191681526020016000815260200160006001600160a01b031681525090565b50600090815260196020908152604091829020825161010081018452815481526001820154928101929092526002810154928201929092526003820154606082015260048201546080820152600582015460a0820152600682015460c08201526007909101546001600160a01b031660e082015290565b610de183838360405180602001604052806000815250611e41565b61167f61112a612258565b6116f15760405162461bcd60e51b815260206004820152603060248201527f4552433732314275726e61626c653a2063616c6c6572206973206e6f74206f7760448201527f6e6572206e6f7220617070726f766564000000000000000000000000000000006064820152608401610c99565b6116fa81612edc565b50565b6117297f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a66108d9612258565b6117755760405162461bcd60e51b815260206004820152600b60248201527f6e6f74206d696e7465722e0000000000000000000000000000000000000000006044820152606401610c99565b60105460006117848583614d07565b601081905560008181526016602052604090209091506117a5908585614593565b5060158054600181810183556000929092527f55f448fdea98c4d29eb340757ef0a66cd03dbb9538908a6a81d96026b71ec475018290557f8d92b22f5855b4d8db025239efe923788e125b3fae327dbebdba3eb9dc42094790839061180a8883614d07565b6118149190614d1f565b86866040516118269493929190614d36565b60405180910390a15050505050565b600061184060085490565b82106118b45760405162461bcd60e51b815260206004820152602c60248201527f455243373231456e756d657261626c653a20676c6f62616c20696e646578206f60448201527f7574206f6620626f756e647300000000000000000000000000000000000000006064820152608401610c99565b600882815481106118c7576118c7614d73565b90600052602060002001549050919050565b6000818152600260205260408120546001600160a01b031680610b8c5760405162461bcd60e51b815260206004820152602960248201527f4552433732313a206f776e657220717565727920666f72206e6f6e657869737460448201527f656e7420746f6b656e00000000000000000000000000000000000000000000006064820152608401610c99565b60006001600160a01b0382166119e25760405162461bcd60e51b815260206004820152602a60248201527f4552433732313a2062616c616e636520717565727920666f7220746865207a6560448201527f726f2061646472657373000000000000000000000000000000000000000000006064820152608401610c99565b506001600160a01b031660009081526003602052604090205490565b611a0b60006108d9612258565b611a4b5760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610c99565b612710811115611a8d5760405162461bcd60e51b815260206004820152600d60248201526c313839901e1e9018981818181760991b6044820152606401610c99565b601280547fffffffffffffffffff000000000000000000000000000000ffffffffffffffff16680100000000000000006effffffffffffffffffffffffffffff8416021790556040518181527f2440645f96173394eb0d508ef9d0c95e3ddc41c6a10ef86e547fc738df9ecce29060200161108b565b611b1060006108d9612258565b611b505760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610c99565b60128054821515600160b81b027fffffffffffffffff00ffffffffffffffffffffffffffffffffffffffffffffff9091161790556040517f2ebd4f59eaa9d49c5dcd06a0afa8b39bf09928fbd60111acee2f986fa485d0989061108b90831515815260200190565b600e546001600160a01b031660009081527fdf7de25b7f1fd6d0b5205f0e18f1f35bd7b8d84cce336588d184533ce43a6f76602052604081205460ff16611bff5750600090565b600e546001600160a01b03165b905090565b6000828152600c60205260408120611c299083612f83565b9392505050565b611c3d60006108d9612258565b611c7d5760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610c99565b610de160138383614593565b606060018054610ba190614bb9565b61158a611ca3612258565b8383612f8f565b611cb760006108d9612258565b611cf75760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610c99565b6000611d0383836122d0565b9050611d0e8161305e565b7fcf5c78d906c121f34b51400d28b5f2ea0670bb6392c731a1abf62f32ca9251188383604051611d3f929190614bf4565b60405180910390a1505050565b60608167ffffffffffffffff811115611d6757611d67614a95565b604051908082528060200260200182016040528015611d9a57816020015b6060815260200190600190039081611d855790505b50905060005b82811015611e3a57611e0a30858584818110611dbe57611dbe614d73565b9050602002810190611dd09190614d89565b8080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061307b92505050565b828281518110611e1c57611e1c614d73565b60200260200101819052508080611e3290614dd0565b915050611da0565b5092915050565b611e52611e4c612258565b8361269f565b611ec45760405162461bcd60e51b815260206004820152603160248201527f4552433732313a207472616e736665722063616c6c6572206973206e6f74206f60448201527f776e6572206e6f7220617070726f7665640000000000000000000000000000006064820152608401610c99565b611ed0848484846130a0565b50505050565b606060005b601554811015611f7d5760158181548110611ef857611ef8614d73565b9060005260206000200154831015611f6b576016600060158381548110611f2157611f21614d73565b90600052602060002001548152602001908152602001600020611f4384613129565b604051602001611f54929190614e07565b604051602081830303815290604052915050919050565b611f76600182614d07565b9050611edb565b5050604080516020810190915260008152919050565b6000818152600c60205260408120610b8c90613227565b60175460009080611ffd5760405162461bcd60e51b815260206004820152601960248201527f6e6f207075626c6963206d696e7420636f6e646974696f6e2e000000000000006044820152606401610c99565b805b80156120505760196000612014600184614d1f565b815260200190815260200160002060000154421061203e57612037600182614d1f565b9250505090565b612049600182614d1f565b9050611fff565b5060405162461bcd60e51b815260206004820152601960248201527f6e6f20616374697665206d696e7420636f6e646974696f6e2e000000000000006044820152606401610c99565b6000828152600b60205260409020600101546120b78161127c612258565b610de18383612eba565b601380546120ce90614bb9565b80601f01602080910402602001604051908101604052809291908181526020018280546120fa90614bb9565b80156121475780601f1061211c57610100808354040283529160200191612147565b820191906000526020600020905b81548152906001019060200180831161212a57829003601f168201915b505050505081565b600a546000906001600160a01b0316331415612172575060131936013560601c90565b503390565b3390565b6000828152600b602090815260408083206001600160a01b038516845290915290205460ff1661158a576000828152600b602090815260408083206001600160a01b03851684529091529020805460ff191660011790556121da612258565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b6000611c29836001600160a01b038416613231565b60006001600160e01b03198216635a05180f60e01b1480610b8c5750610b8c82613280565b6000611c0c61214f565b600081815260046020526040902080546001600160a01b0319166001600160a01b0384169081179091558190612297826118d9565b6001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b60008060005b8381101561261b5781158061230657508484828181106122f8576122f8614d73565b905061010002016000013582105b6123785760405162461bcd60e51b815260206004820152602a60248201527f737461727454696d657374616d70206d75737420626520696e20617363656e6460448201527f696e67206f726465722e000000000000000000000000000000000000000000006064820152608401610c99565b600085858381811061238c5761238c614d73565b9050610100020160200135116123e45760405162461bcd60e51b815260206004820152601c60248201527f6d6178206d696e7420737570706c792063616e6e6f7420626520302e000000006044820152606401610c99565b60008585838181106123f8576123f8614d73565b9050610100020160600135116124505760405162461bcd60e51b815260206004820152601b60248201527f7175616e74697479206c696d69742063616e6e6f7420626520302e00000000006044820152606401610c99565b60405180610100016040528086868481811061246e5761246e614d73565b9050610100020160000135815260200186868481811061249057612490614d73565b90506101000201602001358152602001600081526020018686848181106124b9576124b9614d73565b905061010002016060013581526020018686848181106124db576124db614d73565b905061010002016080013581526020018686848181106124fd576124fd614d73565b9050610100020160a00135815260200186868481811061251f5761251f614d73565b9050610100020160c00135815260200186868481811061254157612541614d73565b9050610100020160e001602081019061255a9190614724565b6001600160a01b039081169091526000858152601960209081526040918290208451815590840151600180830191909155918401516002820155606084015160038201556080840151600482015560a0840151600582015560c0840151600682015560e090930151600790930180546001600160a01b031916939092169290921790556125e79084614d07565b92508484828181106125fb576125fb614d73565b90506101000201600001359150808061261390614dd0565b9150506122d6565b506017548083101561269257825b81811015612690576000818152601960205260408120818155600180820183905560028201839055600382018390556004820183905560058201839055600682019290925560070180546001600160a01b03191690556126899082614d07565b9050612629565b505b5050601781905592915050565b6000818152600260205260408120546001600160a01b03166127185760405162461bcd60e51b815260206004820152602c60248201527f4552433732313a206f70657261746f7220717565727920666f72206e6f6e657860448201526b34b9ba32b73a103a37b5b2b760a11b6064820152608401610c99565b6000612723836118d9565b9050806001600160a01b0316846001600160a01b0316148061275e5750836001600160a01b031661275384610c24565b6001600160a01b0316145b8061278e57506001600160a01b0380821660009081526005602090815260408083209388168352929052205460ff165b949350505050565b826001600160a01b03166127a9826118d9565b6001600160a01b0316146128255760405162461bcd60e51b815260206004820152602960248201527f4552433732313a207472616e73666572206f6620746f6b656e2074686174206960448201527f73206e6f74206f776e00000000000000000000000000000000000000000000006064820152608401610c99565b6001600160a01b0382166128875760405162461bcd60e51b8152602060048201526024808201527f4552433732313a207472616e7366657220746f20746865207a65726f206164646044820152637265737360e01b6064820152608401610c99565b6128928383836132a5565b61289d600082612262565b6001600160a01b03831660009081526003602052604081208054600192906128c6908490614d1f565b90915550506001600160a01b03821660009081526003602052604081208054600192906128f4908490614d07565b909155505060008181526002602052604080822080546001600160a01b0319166001600160a01b0386811691821790925591518493918716917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4505050565b6000828152600b602090815260408083206001600160a01b038516845290915290205460ff1661158a57612993816001600160a01b031660146133bf565b61299e8360206133bf565b6040516020016129af929190614eae565b60408051601f198184030181529082905262461bcd60e51b8252610c99916004016146b7565b6129df828261217b565b6000828152600c60205260409020610de1908261221e565b600085118015612a0b575080606001518511155b612a575760405162461bcd60e51b815260206004820152601960248201527f696e76616c6964207175616e7469747920636c61696d65642e000000000000006044820152606401610c99565b8060200151858260400151612a6c9190614d07565b1115612aba5760405162461bcd60e51b815260206004820152601760248201527f657863656564206d6178206d696e7420737570706c792e0000000000000000006044820152606401610c99565b601854600090612aca9084614d07565b90506000601a81612ad9612258565b6001600160a01b03168152602080820192909252604090810160009081208582529092528120549150612b0e85610644612258565b9050811580612b1d5750804210155b612b695760405162461bcd60e51b815260206004820152601160248201527f63616e6e6f7420636c61696d207965742e0000000000000000000000000000006044820152606401610c99565b60a084015115612c4c576000612b7d612258565b604051602001612ba5919060609190911b6bffffffffffffffffffffffff1916815260140190565b604051602081830303815290604052805190602001209050612bfe88888080602002602001604051908101604052809392919081815260200183836020028082843760009201919091525050505060a087015183613568565b612c4a5760405162461bcd60e51b815260206004820152601160248201527f6e6f7420696e2077686974656c6973742e0000000000000000000000000000006044820152606401610c99565b505b5050505050505050565b60c0820151612c63575050565b60008260c0015182612c759190614cbe565b60125490915060009061271090612ca9906801000000000000000090046effffffffffffffffffffffffffffff1684614cbe565b612cb39190614cf3565b60e08501519091506001600160a01b031673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee1415612d3357813414612d2e5760405162461bcd60e51b815260206004820152601660248201527f6d7573742073656e6420746f74616c2070726963652e000000000000000000006044820152606401610c99565b612d49565b612d49612d3e612258565b8560e001518461357e565b612dda8460e00151612d59612258565b60145460405163f2aab4b360e01b81523060048201526001600160a01b039091169063f2aab4b39060240160206040518083038186803b158015612d9c57600080fd5b505afa158015612db0573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190612dd49190614c8b565b846136fa565b611ed08460e00151612dea612258565b600f546001600160a01b0316612e008587614d1f565b6136fa565b60008281526019602052604081206002018054839290612e26908490614d07565b9091555050601854600090612e3b9084614d07565b905042601a6000612e4a612258565b6001600160a01b0316815260208082019290925260409081016000908120858252909252812091909155601154905b83811015612eb157612e92612e8c612258565b836138d8565b612e9d600183614d07565b9150612eaa600182614d07565b9050612e79565b50601155505050565b612ec48282613a26565b6000828152600c60205260409020610de19082613ac7565b6000612ee7826118d9565b9050612ef5816000846132a5565b612f00600083612262565b6001600160a01b0381166000908152600360205260408120805460019290612f29908490614d1f565b909155505060008281526002602052604080822080546001600160a01b0319169055518391906001600160a01b038416907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908390a45050565b6000611c298383613adc565b816001600160a01b0316836001600160a01b03161415612ff15760405162461bcd60e51b815260206004820152601960248201527f4552433732313a20617070726f766520746f2063616c6c6572000000000000006044820152606401610c99565b6001600160a01b03838116600081815260056020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b80601760010160008282546130739190614d07565b909155505050565b6060611c29838360405180606001604052806027815260200161501260279139613b06565b6130ab848484612796565b6130b784848484613bf1565b611ed05760405162461bcd60e51b815260206004820152603260248201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560448201527f63656976657220696d706c656d656e74657200000000000000000000000000006064820152608401610c99565b60608161314d5750506040805180820190915260018152600360fc1b602082015290565b8160005b8115613177578061316181614dd0565b91506131709050600a83614cf3565b9150613151565b60008167ffffffffffffffff81111561319257613192614a95565b6040519080825280601f01601f1916602001820160405280156131bc576020820181803683370190505b5090505b841561278e576131d1600183614d1f565b91506131de600a86614f2f565b6131e9906030614d07565b60f81b8183815181106131fe576131fe614d73565b60200101906001600160f81b031916908160001a905350613220600a86614cf3565b94506131c0565b6000610b8c825490565b600081815260018301602052604081205461327857508154600181810184556000848152602080822090930184905584548482528286019093526040902091909155610b8c565b506000610b8c565b60006001600160e01b03198216637965db0b60e01b1480610b8c5750610b8c82613d5b565b6132b0838383613d80565b601254600160b81b900460ff1680156132d157506001600160a01b03831615155b80156132e557506001600160a01b03821615155b15610de1576001600160a01b03831660009081527f0a1d1818844cd1cb435b1f58baa821febb23dfe0487ae67aa143cacb2b11bba7602052604090205460ff168061336757506001600160a01b03821660009081527f0a1d1818844cd1cb435b1f58baa821febb23dfe0487ae67aa143cacb2b11bba7602052604090205460ff165b610de15760405162461bcd60e51b815260206004820152602360248201527f7265737472696374656420746f205452414e534645525f524f4c4520686f6c6460448201526265727360e81b6064820152608401610c99565b606060006133ce836002614cbe565b6133d9906002614d07565b67ffffffffffffffff8111156133f1576133f1614a95565b6040519080825280601f01601f19166020018201604052801561341b576020820181803683370190505b509050600360fc1b8160008151811061343657613436614d73565b60200101906001600160f81b031916908160001a905350600f60fb1b8160018151811061346557613465614d73565b60200101906001600160f81b031916908160001a9053506000613489846002614cbe565b613494906001614d07565b90505b6001811115613519577f303132333435363738396162636465660000000000000000000000000000000085600f16601081106134d5576134d5614d73565b1a60f81b8282815181106134eb576134eb614d73565b60200101906001600160f81b031916908160001a90535060049490941c9361351281614f43565b9050613497565b508315611c295760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610c99565b6000826135758584613e38565b14949350505050565b6040516370a0823160e01b81526001600160a01b0384811660048301528291908416906370a082319060240160206040518083038186803b1580156135c257600080fd5b505afa1580156135d6573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906135fa9190614f5a565b101580156136885750604051636eb1769f60e11b81526001600160a01b03848116600483015230602483015282919084169063dd62ed3e9060440160206040518083038186803b15801561364d57600080fd5b505afa158015613661573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906136859190614f5a565b10155b610de15760405162461bcd60e51b815260206004820152602b60248201527f696e73756666696369656e742063757272656e63792062616c616e6365206f7260448201527f20616c6c6f77616e63652e0000000000000000000000000000000000000000006064820152608401610c99565b8061370457611ed0565b6001600160a01b03841673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee14156138cc576001600160a01b0383163014156137c357604051632e1a7d4d60e01b8152600481018290527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031690632e1a7d4d90602401600060405180830381600087803b15801561379c57600080fd5b505af11580156137b0573d6000803e3d6000fd5b505050506137be8282613ee4565b611ed0565b6001600160a01b0382163014156138c2573481146138495760405162461bcd60e51b815260206004820152602d60248201527f6e617469766520746f6b656e2076616c756520646f6573206e6f74206d61746360448201527f682062696420616d6f756e742e000000000000000000000000000000000000006064820152608401610c99565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663d0e30db0826040518263ffffffff1660e01b81526004016000604051808303818588803b1580156138a457600080fd5b505af11580156138b8573d6000803e3d6000fd5b5050505050611ed0565b6137be8282613ee4565b611ed084848484613fdb565b6001600160a01b03821661392e5760405162461bcd60e51b815260206004820181905260248201527f4552433732313a206d696e7420746f20746865207a65726f20616464726573736044820152606401610c99565b6000818152600260205260409020546001600160a01b0316156139935760405162461bcd60e51b815260206004820152601c60248201527f4552433732313a20746f6b656e20616c7265616479206d696e746564000000006044820152606401610c99565b61399f600083836132a5565b6001600160a01b03821660009081526003602052604081208054600192906139c8908490614d07565b909155505060008181526002602052604080822080546001600160a01b0319166001600160a01b03861690811790915590518392907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908290a45050565b6000828152600b602090815260408083206001600160a01b038516845290915290205460ff161561158a576000828152600b602090815260408083206001600160a01b03851684529091529020805460ff19169055613a83612258565b6001600160a01b0316816001600160a01b0316837ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b60405160405180910390a45050565b6000611c29836001600160a01b038416614287565b6000826000018281548110613af357613af3614d73565b9060005260206000200154905092915050565b6060833b613b7c5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e747261637400000000000000000000000000000000000000000000000000006064820152608401610c99565b600080856001600160a01b031685604051613b979190614f73565b600060405180830381855af49150503d8060008114613bd2576040519150601f19603f3d011682016040523d82523d6000602084013e613bd7565b606091505b5091509150613be782828661437a565b9695505050505050565b60006001600160a01b0384163b15613d5057836001600160a01b031663150b7a02613c1a612258565b8786866040518563ffffffff1660e01b8152600401613c3c9493929190614f8f565b602060405180830381600087803b158015613c5657600080fd5b505af1925050508015613c86575060408051601f3d908101601f19168201909252613c8391810190614fc1565b60015b613d36573d808015613cb4576040519150601f19603f3d011682016040523d82523d6000602084013e613cb9565b606091505b508051613d2e5760405162461bcd60e51b815260206004820152603260248201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560448201527f63656976657220696d706c656d656e74657200000000000000000000000000006064820152608401610c99565b805181602001fd5b6001600160e01b031916630a85bd0160e11b14905061278e565b506001949350505050565b60006001600160e01b0319821663780e9d6360e01b1480610b8c5750610b8c826143b3565b6001600160a01b038316613ddb57613dd681600880546000838152600960205260408120829055600182018355919091527ff3f7a9fe364faab93b216da50a3214154f22a0a2b415b23a84c8169e8b636ee30155565b613dfe565b816001600160a01b0316836001600160a01b031614613dfe57613dfe8382614403565b6001600160a01b038216613e1557610de1816144a0565b826001600160a01b0316826001600160a01b031614610de157610de1828261454f565b600081815b8451811015613edc576000858281518110613e5a57613e5a614d73565b60200260200101519050808311613e9c576040805160208101859052908101829052606001604051602081830303815290604052805190602001209250613ec9565b60408051602081018390529081018490526060016040516020818303038152906040528051906020012092505b5080613ed481614dd0565b915050613e3d565b509392505050565b6000826001600160a01b03168260405160006040518083038185875af1925050503d8060008114613f31576040519150601f19603f3d011682016040523d82523d6000602084013e613f36565b606091505b5050905080610de1577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663d0e30db0836040518263ffffffff1660e01b81526004016000604051808303818588803b158015613f9a57600080fd5b505af1158015613fae573d6000803e3d6000fd5b5050505050610de17f00000000000000000000000000000000000000000000000000000000000000003085855b816001600160a01b0316836001600160a01b03161415613ffa57611ed0565b6040516370a0823160e01b81526001600160a01b038381166004830152600091908616906370a082319060240160206040518083038186803b15801561403f57600080fd5b505afa158015614053573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906140779190614f5a565b905060006001600160a01b038516301461411a576040516323b872dd60e01b81526001600160a01b0386811660048301528581166024830152604482018590528716906323b872dd90606401602060405180830381600087803b1580156140dd57600080fd5b505af11580156140f1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906141159190614fde565b61419c565b60405163a9059cbb60e01b81526001600160a01b0385811660048301526024820185905287169063a9059cbb90604401602060405180830381600087803b15801561416457600080fd5b505af1158015614178573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061419c9190614fde565b6040516370a0823160e01b81526001600160a01b0386811660048301529192506000918816906370a082319060240160206040518083038186803b1580156141e357600080fd5b505afa1580156141f7573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061421b9190614f5a565b9050818015614232575061422f8484614d07565b81145b61427e5760405162461bcd60e51b815260206004820152601c60248201527f6661696c656420746f207472616e736665722063757272656e63792e000000006044820152606401610c99565b50505050505050565b600081815260018301602052604081205480156143705760006142ab600183614d1f565b85549091506000906142bf90600190614d1f565b90508181146143245760008660000182815481106142df576142df614d73565b906000526020600020015490508087600001848154811061430257614302614d73565b6000918252602080832090910192909255918252600188019052604090208390555b855486908061433557614335614ffb565b600190038181906000526020600020016000905590558560010160008681526020019081526020016000206000905560019350505050610b8c565b6000915050610b8c565b60608315614389575081611c29565b8251156143995782518084602001fd5b8160405162461bcd60e51b8152600401610c9991906146b7565b60006001600160e01b031982166380ac58cd60e01b14806143e457506001600160e01b03198216635b5e139f60e01b145b80610b8c57506301ffc9a760e01b6001600160e01b0319831614610b8c565b6000600161441084611964565b61441a9190614d1f565b60008381526007602052604090205490915080821461446d576001600160a01b03841660009081526006602090815260408083208584528252808320548484528184208190558352600790915290208190555b5060009182526007602090815260408084208490556001600160a01b039094168352600681528383209183525290812055565b6008546000906144b290600190614d1f565b600083815260096020526040812054600880549394509092849081106144da576144da614d73565b9060005260206000200154905080600883815481106144fb576144fb614d73565b600091825260208083209091019290925582815260099091526040808220849055858252812055600880548061453357614533614ffb565b6001900381819060005260206000200160009055905550505050565b600061455a83611964565b6001600160a01b039093166000908152600660209081526040808320868452825280832085905593825260079052919091209190915550565b82805461459f90614bb9565b90600052602060002090601f0160209004810192826145c15760008555614607565b82601f106145da5782800160ff19823516178555614607565b82800160010185558215614607579182015b828111156146075782358255916020019190600101906145ec565b50614613929150614617565b5090565b5b808211156146135760008155600101614618565b6001600160e01b0319811681146116fa57600080fd5b60006020828403121561465457600080fd5b8135611c298161462c565b60005b8381101561467a578181015183820152602001614662565b83811115611ed05750506000910152565b600081518084526146a381602086016020860161465f565b601f01601f19169290920160200192915050565b602081526000611c29602083018461468b565b6000602082840312156146dc57600080fd5b5035919050565b6001600160a01b03811681146116fa57600080fd5b6000806040838503121561470b57600080fd5b8235614716816146e3565b946020939093013593505050565b60006020828403121561473657600080fd5b8135611c29816146e3565b6000806020838503121561475457600080fd5b823567ffffffffffffffff8082111561476c57600080fd5b818501915085601f83011261478057600080fd5b81358181111561478f57600080fd5b8660208260081b85010111156147a457600080fd5b60209290920196919550909350505050565b6000806000606084860312156147cb57600080fd5b83356147d6816146e3565b925060208401356147e6816146e3565b929592945050506040919091013590565b6000806040838503121561480a57600080fd5b50508035926020909101359150565b6000806040838503121561482c57600080fd5b82359150602083013561483e816146e3565b809150509250929050565b60008083601f84011261485b57600080fd5b50813567ffffffffffffffff81111561487357600080fd5b6020830191508360208260051b850101111561488e57600080fd5b9250929050565b6000806000604084860312156148aa57600080fd5b83359250602084013567ffffffffffffffff8111156148c857600080fd5b6148d486828701614849565b9497909650939450505050565b60008083601f8401126148f357600080fd5b50813567ffffffffffffffff81111561490b57600080fd5b60208301915083602082850101111561488e57600080fd5b60008060006040848603121561493857600080fd5b83359250602084013567ffffffffffffffff81111561495657600080fd5b6148d4868287016148e1565b80151581146116fa57600080fd5b60006020828403121561498257600080fd5b8135611c2981614962565b600080602083850312156149a057600080fd5b823567ffffffffffffffff8111156149b757600080fd5b6149c3858286016148e1565b90969095509350505050565b600080604083850312156149e257600080fd5b82356149ed816146e3565b9150602083013561483e81614962565b60008060208385031215614a1057600080fd5b823567ffffffffffffffff811115614a2757600080fd5b6149c385828601614849565b6000602080830181845280855180835260408601915060408160051b870101925083870160005b82811015614a8857603f19888603018452614a7685835161468b565b94509285019290850190600101614a5a565b5092979650505050505050565b634e487b7160e01b600052604160045260246000fd5b60008060008060808587031215614ac157600080fd5b8435614acc816146e3565b93506020850135614adc816146e3565b925060408501359150606085013567ffffffffffffffff80821115614b0057600080fd5b818701915087601f830112614b1457600080fd5b813581811115614b2657614b26614a95565b604051601f8201601f19908116603f01168101908382118183101715614b4e57614b4e614a95565b816040528281528a6020848701011115614b6757600080fd5b82602086016020830137600060208483010152809550505050505092959194509250565b60008060408385031215614b9e57600080fd5b8235614ba9816146e3565b9150602083013561483e816146e3565b600181811c90821680614bcd57607f821691505b60208210811415614bee57634e487b7160e01b600052602260045260246000fd5b50919050565b6020808252818101839052600090604080840186845b87811015614c7e578135835284820135858401528382013584840152606080830135908401526080808301359084015260a0808301359084015260c0808301359084015260e080830135614c5d816146e3565b6001600160a01b031690840152610100928301929190910190600101614c0a565b5090979650505050505050565b600060208284031215614c9d57600080fd5b8151611c29816146e3565b634e487b7160e01b600052601160045260246000fd5b6000816000190483118215151615614cd857614cd8614ca8565b500290565b634e487b7160e01b600052601260045260246000fd5b600082614d0257614d02614cdd565b500490565b60008219821115614d1a57614d1a614ca8565b500190565b600082821015614d3157614d31614ca8565b500390565b84815283602082015260606040820152816060820152818360808301376000818301608090810191909152601f909201601f191601019392505050565b634e487b7160e01b600052603260045260246000fd5b6000808335601e19843603018112614da057600080fd5b83018035915067ffffffffffffffff821115614dbb57600080fd5b60200191503681900382131561488e57600080fd5b6000600019821415614de457614de4614ca8565b5060010190565b60008151614dfd81856020860161465f565b9290920192915050565b600080845481600182811c915080831680614e2357607f831692505b6020808410821415614e4357634e487b7160e01b86526022600452602486fd5b818015614e575760018114614e6857614e95565b60ff19861689528489019650614e95565b60008b81526020902060005b86811015614e8d5781548b820152908501908301614e74565b505084890196505b505050505050614ea58185614deb565b95945050505050565b7f416363657373436f6e74726f6c3a206163636f756e7420000000000000000000815260008351614ee681601785016020880161465f565b7f206973206d697373696e6720726f6c65200000000000000000000000000000006017918401918201528351614f2381602884016020880161465f565b01602801949350505050565b600082614f3e57614f3e614cdd565b500690565b600081614f5257614f52614ca8565b506000190190565b600060208284031215614f6c57600080fd5b5051919050565b60008251614f8581846020870161465f565b9190910192915050565b60006001600160a01b03808716835280861660208401525083604083015260806060830152613be7608083018461468b565b600060208284031215614fd357600080fd5b8151611c298161462c565b600060208284031215614ff057600080fd5b8151611c2981614962565b634e487b7160e01b600052603160045260246000fdfe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a164736f6c6343000809000a";
}
