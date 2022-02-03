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
          indexed: true,
          internalType: "address",
          name: "receiver",
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
      inputs: [],
      name: "VERSION",
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
          internalType: "address",
          name: "_receiver",
          type: "address",
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
    {
      inputs: [
        {
          internalType: "address",
          name: "_claimer",
          type: "address",
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
        {
          internalType: "uint256",
          name: "_conditionIndex",
          type: "uint256",
        },
      ],
      name: "verifyClaim",
      outputs: [],
      stateMutability: "view",
      type: "function",
    },
  ];

  static readonly bytecode =
    "0x60a06040523480156200001157600080fd5b506040516200584638038062005846833981016040819052620000349162000502565b84898981600090805190602001906200004f9291906200035a565b508051620000659060019060208401906200035a565b5050600a80546001600160a01b03199081166001600160a01b03948516179091556001600d556014805482168a8516179055868316608052600f805490911692861692909217909155508651620000c49060139060208a01906200035a565b50601280546001600160781b03831668010000000000000000026001600160b81b03199091166001600160401b0385161717905560006200010462000196565b600e80546001600160a01b0319166001600160a01b03831617905590506200012e600082620001b2565b6200015a7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a682620001b2565b620001867f8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c82620001b2565b5050505050505050505062000641565b6000620001ad620001c260201b620024bb1760201c565b905090565b620001be8282620001fb565b5050565b600a546000906001600160a01b0316331415620001e6575060131936013560601c90565b620001ad6200023e60201b620024e31760201c565b6200021282826200024260201b620024e71760201c565b6000828152600c60209081526040909120620002399183906200258a620002e8821b17901c565b505050565b3390565b6000828152600b602090815260408083206001600160a01b038516845290915290205460ff16620001be576000828152600b602090815260408083206001600160a01b03851684529091529020805460ff19166001179055620002a462000196565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b6000620002ff836001600160a01b03841662000308565b90505b92915050565b6000818152600183016020526040812054620003515750815460018181018455600084815260208082209093018490558454848252828601909352604090209190915562000302565b50600062000302565b828054620003689062000604565b90600052602060002090601f0160209004810192826200038c5760008555620003d7565b82601f10620003a757805160ff1916838001178555620003d7565b82800160010185558215620003d7579182015b82811115620003d7578251825591602001919060010190620003ba565b50620003e5929150620003e9565b5090565b5b80821115620003e55760008155600101620003ea565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200042857600080fd5b81516001600160401b038082111562000445576200044562000400565b604051601f8301601f19908116603f0116810190828211818310171562000470576200047062000400565b816040528381526020925086838588010111156200048d57600080fd5b600091505b83821015620004b1578582018301518183018401529082019062000492565b83821115620004c35760008385830101525b9695505050505050565b80516001600160a01b0381168114620004e557600080fd5b919050565b80516001600160801b0381168114620004e557600080fd5b60008060008060008060008060006101208a8c0312156200052257600080fd5b89516001600160401b03808211156200053a57600080fd5b620005488d838e0162000416565b9a5060208c01519150808211156200055f57600080fd5b6200056d8d838e0162000416565b995060408c01519150808211156200058457600080fd5b50620005938c828d0162000416565b975050620005a460608b01620004cd565b9550620005b460808b01620004cd565b9450620005c460a08b01620004cd565b9350620005d460c08b01620004cd565b9250620005e460e08b01620004ea565b9150620005f56101008b01620004ea565b90509295985092959850929598565b600181811c908216806200061957607f821691505b602082108114156200063b57634e487b7160e01b600052602260045260246000fd5b50919050565b6080516151cd6200067960003960008181610b7a015281816139b901528181613ab40152818161413b01526141b201526151cd6000f3fe6080604052600436106103605760003560e01c8063572b6c05116101c6578063a3d85fb1116100f7578063ceb4aff311610095578063e8a3d4851161006f578063e8a3d48514610b0a578063e985e9c514610b1f578063f9ea29cb14610b68578063ffa1ad7414610b9c57600080fd5b8063ceb4aff314610aa1578063d539139314610ab6578063d547741f14610aea57600080fd5b8063b88d4fde116100d1578063b88d4fde14610a07578063c63adb2b14610a27578063c87b56dd14610a61578063ca15c87314610a8157600080fd5b8063a3d85fb1146109a4578063ac9650d8146109c4578063acd083f8146109f157600080fd5b80638da5cb5b11610164578063938e3d7b1161013e578063938e3d7b1461093a57806395d89b411461095a578063a217fddf1461096f578063a22cb4651461098457600080fd5b80638da5cb5b146108bf5780639010d07c146108d457806391d14854146108f457600080fd5b806370a08231116101a057806370a082311461083e57806372c27b621461085e5780638423df791461087e5780638ba448c21461089f57600080fd5b8063572b6c05146107bf5780636352211e146107ee578063666134631461080e57600080fd5b8063248a9ca3116102a05780633707d9dc1161023e57806342842e0e1161021857806342842e0e1461073f57806342966c681461075f578063471582641461077f5780634f6ccce71461079f57600080fd5b80633707d9dc1461068c5780633b1475a7146107165780633d13f8741461072c57600080fd5b80632f2ff15d1161027a5780632f2ff15d1461060c5780632f745c591461062c57806333fd29991461064c57806336568abe1461066c57600080fd5b8063248a9ca31461054957806324a9d853146105795780632a55205a146105cd57600080fd5b80631490ee761161030d5780632053a5cc116102e75780632053a5cc146104b5578063206b60f9146104d557806323b872dd14610509578063246b436b1461052957600080fd5b80631490ee761461045657806318160ddd146104765780631f72d8311461049557600080fd5b8063095ea7b31161033e578063095ea7b3146103f4578063097b3cdb1461041657806313af40351461043657600080fd5b806301ffc9a71461036557806306fdde031461039a578063081812fc146103bc575b600080fd5b34801561037157600080fd5b50610385610380366004614749565b610bb1565b60405190151581526020015b60405180910390f35b3480156103a657600080fd5b506103af610bdd565b60405161039191906147be565b3480156103c857600080fd5b506103dc6103d73660046147d1565b610c6f565b6040516001600160a01b039091168152602001610391565b34801561040057600080fd5b5061041461040f3660046147ff565b610d09565b005b34801561042257600080fd5b50610414610431366004614877565b610e31565b34801561044257600080fd5b506104146104513660046148db565b61113f565b34801561046257600080fd5b506104146104713660046148db565b611275565b34801561048257600080fd5b506008545b604051908152602001610391565b3480156104a157600080fd5b506104146104b03660046147d1565b61130c565b3480156104c157600080fd5b506104146104d03660046148f8565b6113ef565b3480156104e157600080fd5b506104877f8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c81565b34801561051557600080fd5b5061041461052436600461496d565b611478565b34801561053557600080fd5b50600f546103dc906001600160a01b031681565b34801561055557600080fd5b506104876105643660046147d1565b6000908152600b602052604090206001015490565b34801561058557600080fd5b506012546105ad906801000000000000000090046effffffffffffffffffffffffffffff1681565b6040516effffffffffffffffffffffffffffff9091168152602001610391565b3480156105d957600080fd5b506105ed6105e83660046149ae565b611506565b604080516001600160a01b039093168352602083019190915201610391565b34801561061857600080fd5b506104146106273660046149d0565b6115b7565b34801561063857600080fd5b506104876106473660046147ff565b6115e4565b34801561065857600080fd5b506104876106673660046149d0565b61168c565b34801561067857600080fd5b506104146106873660046149d0565b6116ee565b34801561069857600080fd5b506106ac6106a73660046147d1565b61178a565b6040516103919190600061010082019050825182526020830151602083015260408301516040830152606083015160608301526080830151608083015260a083015160a083015260c083015160c08301526001600160a01b0360e08401511660e083015292915050565b34801561072257600080fd5b5061048760105481565b61041461073a366004614a00565b611855565b34801561074b57600080fd5b5061041461075a36600461496d565b6119c5565b34801561076b57600080fd5b5061041461077a3660046147d1565b6119e0565b34801561078b57600080fd5b5061041461079a366004614a9e565b611a69565b3480156107ab57600080fd5b506104876107ba3660046147d1565b611ba1565b3480156107cb57600080fd5b506103856107da3660046148db565b600a546001600160a01b0391821691161490565b3480156107fa57600080fd5b506103dc6108093660046147d1565b611c45565b34801561081a57600080fd5b50601754601854610829919082565b60408051928352602083019190915201610391565b34801561084a57600080fd5b506104876108593660046148db565b611cd0565b34801561086a57600080fd5b506104146108793660046147d1565b611d6a565b34801561088a57600080fd5b5060125461038590600160b81b900460ff1681565b3480156108ab57600080fd5b506104146108ba366004614af8565b611e6f565b3480156108cb57600080fd5b506103dc611f24565b3480156108e057600080fd5b506103dc6108ef3660046149ae565b611f7d565b34801561090057600080fd5b5061038561090f3660046149d0565b6000918252600b602090815260408084206001600160a01b0393909316845291905290205460ff1690565b34801561094657600080fd5b50610414610955366004614b15565b611f9c565b34801561096657600080fd5b506103af611ff5565b34801561097b57600080fd5b50610487600081565b34801561099057600080fd5b5061041461099f366004614b57565b612004565b3480156109b057600080fd5b506104146109bf3660046148f8565b612016565b3480156109d057600080fd5b506109e46109df366004614b85565b6120b8565b6040516103919190614bbb565b3480156109fd57600080fd5b5061048760115481565b348015610a1357600080fd5b50610414610a22366004614c33565b6121ad565b348015610a3357600080fd5b50601254610a489067ffffffffffffffff1681565b60405167ffffffffffffffff9091168152602001610391565b348015610a6d57600080fd5b506103af610a7c3660046147d1565b612242565b348015610a8d57600080fd5b50610487610a9c3660046147d1565b6122ff565b348015610aad57600080fd5b50610487612316565b348015610ac257600080fd5b506104877f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a681565b348015610af657600080fd5b50610414610b053660046149d0565b612405565b348015610b1657600080fd5b506103af61242d565b348015610b2b57600080fd5b50610385610b3a366004614d13565b6001600160a01b03918216600090815260056020908152604080832093909416825291909152205460ff1690565b348015610b7457600080fd5b506103dc7f000000000000000000000000000000000000000000000000000000000000000081565b348015610ba857600080fd5b50610487600181565b6000610bbc8261259f565b80610bd757506001600160e01b0319821663152a902d60e11b145b92915050565b606060008054610bec90614d41565b80601f0160208091040260200160405190810160405280929190818152602001828054610c1890614d41565b8015610c655780601f10610c3a57610100808354040283529160200191610c65565b820191906000526020600020905b815481529060010190602001808311610c4857829003601f168201915b5050505050905090565b6000818152600260205260408120546001600160a01b0316610ced5760405162461bcd60e51b815260206004820152602c60248201527f4552433732313a20617070726f76656420717565727920666f72206e6f6e657860448201526b34b9ba32b73a103a37b5b2b760a11b60648201526084015b60405180910390fd5b506000908152600460205260409020546001600160a01b031690565b6000610d1482611c45565b9050806001600160a01b0316836001600160a01b03161415610d825760405162461bcd60e51b815260206004820152602160248201527f4552433732313a20617070726f76616c20746f2063757272656e74206f776e656044820152603960f91b6064820152608401610ce4565b806001600160a01b0316610d946125c4565b6001600160a01b03161480610db05750610db081610b3a6125c4565b610e225760405162461bcd60e51b815260206004820152603860248201527f4552433732313a20617070726f76652063616c6c6572206973206e6f74206f7760448201527f6e6572206e6f7220617070726f76656420666f7220616c6c00000000000000006064820152608401610ce4565b610e2c83836125ce565b505050565b600081815260196020908152604091829020825161010081018452815481526001820154928101929092526002810154928201929092526003820154606082015260048201546080820152600582015460a0820152600682015460c08201526007909101546001600160a01b031660e08201528415801590610eb7575080606001518511155b610f035760405162461bcd60e51b815260206004820152601960248201527f696e76616c6964207175616e7469747920636c61696d65642e000000000000006044820152606401610ce4565b8060200151858260400151610f189190614d92565b1115610f665760405162461bcd60e51b815260206004820152601760248201527f657863656564206d6178206d696e7420737570706c792e0000000000000000006044820152606401610ce4565b60105485601154610f779190614d92565b1115610fc55760405162461bcd60e51b815260206004820152601960248201527f6e6f7420656e6f756768206d696e74656420746f6b656e732e000000000000006044820152606401610ce4565b601854600090610fd59084614d92565b6001600160a01b0388166000908152601a60209081526040808320848452909152812054919250611006858a61168c565b90508115806110155750804210155b6110615760405162461bcd60e51b815260206004820152601160248201527f63616e6e6f7420636c61696d207965742e0000000000000000000000000000006044820152606401610ce4565b60a084015115611134576040516bffffffffffffffffffffffff1960608b901b1660208201526000906034016040516020818303038152906040528051906020012090506110e688888080602002602001604051908101604052809392919081815260200183836020028082843760009201919091525050505060a08701518361263c565b6111325760405162461bcd60e51b815260206004820152601160248201527f6e6f7420696e2077686974656c6973742e0000000000000000000000000000006044820152606401610ce4565b505b505050505050505050565b61114c600061090f6125c4565b61118c5760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610ce4565b6001600160a01b03811660009081527fdf7de25b7f1fd6d0b5205f0e18f1f35bd7b8d84cce336588d184533ce43a6f76602052604090205460ff166112135760405162461bcd60e51b815260206004820152601b60248201527f6e6577206f776e6572206e6f74206d6f64756c652061646d696e2e00000000006044820152606401610ce4565b600e80546001600160a01b038381166001600160a01b031983168117909355604080519190921680825260208201939093527f70aea8d848e8a90fb7661b227dc522eb6395c3dac71b63cb59edd5c9899b236491015b60405180910390a15050565b611282600061090f6125c4565b6112c25760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610ce4565b600f80546001600160a01b0319166001600160a01b0383169081179091556040517f7469c47fe13b9fc961c218a4b283151f80fc15e3a95e1d1b95aeace021f3d0cc90600090a250565b611319600061090f6125c4565b6113595760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610ce4565b61271081111561139b5760405162461bcd60e51b815260206004820152600d60248201526c313839901e1e9018981818181760991b6044820152606401610ce4565b6012805467ffffffffffffffff191667ffffffffffffffff83161790556040518181527f244ea8d7627f5a08f4299862bd5a45752842c183aee5b0fb0d1e4887bfa605b3906020015b60405180910390a150565b6113fc600061090f6125c4565b61143c5760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610ce4565b6114468282612652565b507fcf5c78d906c121f34b51400d28b5f2ea0670bb6392c731a1abf62f32ca9251188282604051611269929190614daa565b6114896114836125c4565b82612a21565b6114fb5760405162461bcd60e51b815260206004820152603160248201527f4552433732313a207472616e736665722063616c6c6572206973206e6f74206f60448201527f776e6572206e6f7220617070726f7665640000000000000000000000000000006064820152608401610ce4565b610e2c838383612b18565b60145460405163f2aab4b360e01b815230600482015260009182916001600160a01b039091169063f2aab4b39060240160206040518083038186803b15801561154e57600080fd5b505afa158015611562573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115869190614e41565b601254909250612710906115a49067ffffffffffffffff1685614e5e565b6115ae9190614e93565b90509250929050565b6000828152600b60205260409020600101546115da816115d56125c4565b612cd7565b610e2c8383612d57565b60006115ef83611cd0565b82106116635760405162461bcd60e51b815260206004820152602b60248201527f455243373231456e756d657261626c653a206f776e657220696e646578206f7560448201527f74206f6620626f756e64730000000000000000000000000000000000000000006064820152608401610ce4565b506001600160a01b03919091166000908152600660209081526040808320938352929052205490565b601854600090819061169e9085614d92565b6001600160a01b0384166000908152601a6020908152604080832084845282528083205488845260199092529091206004015481019350909150808310156116e65760001992505b505092915050565b6116f66125c4565b6001600160a01b0316816001600160a01b03161461177c5760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201527f20726f6c657320666f722073656c6600000000000000000000000000000000006064820152608401610ce4565b6117868282612d79565b5050565b6117de6040518061010001604052806000815260200160008152602001600081526020016000815260200160008152602001600080191681526020016000815260200160006001600160a01b031681525090565b50600090815260196020908152604091829020825161010081018452815481526001820154928101929092526002810154928201929092526003820154606082015260048201546080820152600582015460a0820152600682015460c08201526007909101546001600160a01b031660e082015290565b6002600d5414156118a85760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c006044820152606401610ce4565b6002600d5560115460006118ba612316565b600081815260196020908152604091829020825161010081018452815481526001820154928101929092526002810154928201929092526003820154606082015260048201546080820152600582015460a0820152600682015460c08201526007909101546001600160a01b031660e082015290915061194461193b6125c4565b87878786610e31565b61194e8187612d9b565b611959878388612f4a565b866001600160a01b031661196b6125c4565b6001600160a01b0316837faf1e1d601fecda9f5eba2b8827408bd49c1694335fb8dce97a322495edc87017868a6040516119af929190918252602082015260400190565b60405180910390a450506001600d555050505050565b610e2c838383604051806020016040528060008152506121ad565b6119eb6114836125c4565b611a5d5760405162461bcd60e51b815260206004820152603060248201527f4552433732314275726e61626c653a2063616c6c6572206973206e6f74206f7760448201527f6e6572206e6f7220617070726f766564000000000000000000000000000000006064820152608401610ce4565b611a6681612ff9565b50565b611a957f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a661090f6125c4565b611ae15760405162461bcd60e51b815260206004820152600b60248201527f6e6f74206d696e7465722e0000000000000000000000000000000000000000006044820152606401610ce4565b6010546000611af08583614d92565b60108190556000818152601660205260409020909150611b1190858561469a565b5060158054600181810183556000929092527f55f448fdea98c4d29eb340757ef0a66cd03dbb9538908a6a81d96026b71ec475018290557f8d92b22f5855b4d8db025239efe923788e125b3fae327dbebdba3eb9dc420947908390611b768883614d92565b611b809190614ea7565b8686604051611b929493929190614ebe565b60405180910390a15050505050565b6000611bac60085490565b8210611c205760405162461bcd60e51b815260206004820152602c60248201527f455243373231456e756d657261626c653a20676c6f62616c20696e646578206f60448201527f7574206f6620626f756e647300000000000000000000000000000000000000006064820152608401610ce4565b60088281548110611c3357611c33614efb565b90600052602060002001549050919050565b6000818152600260205260408120546001600160a01b031680610bd75760405162461bcd60e51b815260206004820152602960248201527f4552433732313a206f776e657220717565727920666f72206e6f6e657869737460448201527f656e7420746f6b656e00000000000000000000000000000000000000000000006064820152608401610ce4565b60006001600160a01b038216611d4e5760405162461bcd60e51b815260206004820152602a60248201527f4552433732313a2062616c616e636520717565727920666f7220746865207a6560448201527f726f2061646472657373000000000000000000000000000000000000000000006064820152608401610ce4565b506001600160a01b031660009081526003602052604090205490565b611d77600061090f6125c4565b611db75760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610ce4565b612710811115611df95760405162461bcd60e51b815260206004820152600d60248201526c313839901e1e9018981818181760991b6044820152606401610ce4565b601280547fffffffffffffffffff000000000000000000000000000000ffffffffffffffff16680100000000000000006effffffffffffffffffffffffffffff8416021790556040518181527f2440645f96173394eb0d508ef9d0c95e3ddc41c6a10ef86e547fc738df9ecce2906020016113e4565b611e7c600061090f6125c4565b611ebc5760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610ce4565b60128054821515600160b81b027fffffffffffffffff00ffffffffffffffffffffffffffffffffffffffffffffff9091161790556040517f2ebd4f59eaa9d49c5dcd06a0afa8b39bf09928fbd60111acee2f986fa485d098906113e490831515815260200190565b600e546001600160a01b031660009081527fdf7de25b7f1fd6d0b5205f0e18f1f35bd7b8d84cce336588d184533ce43a6f76602052604081205460ff16611f6b5750600090565b600e546001600160a01b03165b905090565b6000828152600c60205260408120611f9590836130a0565b9392505050565b611fa9600061090f6125c4565b611fe95760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610ce4565b610e2c6013838361469a565b606060018054610bec90614d41565b61178661200f6125c4565b83836130ac565b612023600061090f6125c4565b6120635760405162461bcd60e51b81526020600482015260116024820152703737ba1036b7b23ab6329030b236b4b71760791b6044820152606401610ce4565b600061206f8383612652565b905061207a8161317b565b7fcf5c78d906c121f34b51400d28b5f2ea0670bb6392c731a1abf62f32ca92511883836040516120ab929190614daa565b60405180910390a1505050565b60608167ffffffffffffffff8111156120d3576120d3614c1d565b60405190808252806020026020018201604052801561210657816020015b60608152602001906001900390816120f15790505b50905060005b828110156121a6576121763085858481811061212a5761212a614efb565b905060200281019061213c9190614f11565b8080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061319892505050565b82828151811061218857612188614efb565b6020026020010181905250808061219e90614f58565b91505061210c565b5092915050565b6121be6121b86125c4565b83612a21565b6122305760405162461bcd60e51b815260206004820152603160248201527f4552433732313a207472616e736665722063616c6c6572206973206e6f74206f60448201527f776e6572206e6f7220617070726f7665640000000000000000000000000000006064820152608401610ce4565b61223c848484846131bd565b50505050565b606060005b6015548110156122e9576015818154811061226457612264614efb565b90600052602060002001548310156122d757601660006015838154811061228d5761228d614efb565b906000526020600020015481526020019081526020016000206122af84613246565b6040516020016122c0929190614f8f565b604051602081830303815290604052915050919050565b6122e2600182614d92565b9050612247565b5050604080516020810190915260008152919050565b6000818152600c60205260408120610bd790613344565b601754600090806123695760405162461bcd60e51b815260206004820152601960248201527f6e6f207075626c6963206d696e7420636f6e646974696f6e2e000000000000006044820152606401610ce4565b805b80156123bc5760196000612380600184614ea7565b81526020019081526020016000206000015442106123aa576123a3600182614ea7565b9250505090565b6123b5600182614ea7565b905061236b565b5060405162461bcd60e51b815260206004820152601960248201527f6e6f20616374697665206d696e7420636f6e646974696f6e2e000000000000006044820152606401610ce4565b6000828152600b6020526040902060010154612423816115d56125c4565b610e2c8383612d79565b6013805461243a90614d41565b80601f016020809104026020016040519081016040528092919081815260200182805461246690614d41565b80156124b35780601f10612488576101008083540402835291602001916124b3565b820191906000526020600020905b81548152906001019060200180831161249657829003601f168201915b505050505081565b600a546000906001600160a01b03163314156124de575060131936013560601c90565b503390565b3390565b6000828152600b602090815260408083206001600160a01b038516845290915290205460ff16611786576000828152600b602090815260408083206001600160a01b03851684529091529020805460ff191660011790556125466125c4565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b6000611f95836001600160a01b03841661334e565b60006001600160e01b03198216635a05180f60e01b1480610bd75750610bd78261339d565b6000611f786124bb565b600081815260046020526040902080546001600160a01b0319166001600160a01b038416908117909155819061260382611c45565b6001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b60008261264985846133c2565b14949350505050565b60008060005b8381101561299d57811580612688575084848281811061267a5761267a614efb565b905061010002016000013582105b6126fa5760405162461bcd60e51b815260206004820152602a60248201527f737461727454696d657374616d70206d75737420626520696e20617363656e6460448201527f696e67206f726465722e000000000000000000000000000000000000000000006064820152608401610ce4565b600085858381811061270e5761270e614efb565b9050610100020160200135116127665760405162461bcd60e51b815260206004820152601c60248201527f6d6178206d696e7420737570706c792063616e6e6f7420626520302e000000006044820152606401610ce4565b600085858381811061277a5761277a614efb565b9050610100020160600135116127d25760405162461bcd60e51b815260206004820152601b60248201527f7175616e74697479206c696d69742063616e6e6f7420626520302e00000000006044820152606401610ce4565b6040518061010001604052808686848181106127f0576127f0614efb565b9050610100020160000135815260200186868481811061281257612812614efb565b905061010002016020013581526020016000815260200186868481811061283b5761283b614efb565b9050610100020160600135815260200186868481811061285d5761285d614efb565b9050610100020160800135815260200186868481811061287f5761287f614efb565b9050610100020160a0013581526020018686848181106128a1576128a1614efb565b9050610100020160c0013581526020018686848181106128c3576128c3614efb565b9050610100020160e00160208101906128dc91906148db565b6001600160a01b039081169091526000858152601960209081526040918290208451815590840151600180830191909155918401516002820155606084015160038201556080840151600482015560a0840151600582015560c0840151600682015560e090930151600790930180546001600160a01b031916939092169290921790556129699084614d92565b925084848281811061297d5761297d614efb565b90506101000201600001359150808061299590614f58565b915050612658565b5060175480831015612a1457825b81811015612a12576000818152601960205260408120818155600180820183905560028201839055600382018390556004820183905560058201839055600682019290925560070180546001600160a01b0319169055612a0b9082614d92565b90506129ab565b505b5050601781905592915050565b6000818152600260205260408120546001600160a01b0316612a9a5760405162461bcd60e51b815260206004820152602c60248201527f4552433732313a206f70657261746f7220717565727920666f72206e6f6e657860448201526b34b9ba32b73a103a37b5b2b760a11b6064820152608401610ce4565b6000612aa583611c45565b9050806001600160a01b0316846001600160a01b03161480612ae05750836001600160a01b0316612ad584610c6f565b6001600160a01b0316145b80612b1057506001600160a01b0380821660009081526005602090815260408083209388168352929052205460ff165b949350505050565b826001600160a01b0316612b2b82611c45565b6001600160a01b031614612ba75760405162461bcd60e51b815260206004820152602960248201527f4552433732313a207472616e73666572206f6620746f6b656e2074686174206960448201527f73206e6f74206f776e00000000000000000000000000000000000000000000006064820152608401610ce4565b6001600160a01b038216612c095760405162461bcd60e51b8152602060048201526024808201527f4552433732313a207472616e7366657220746f20746865207a65726f206164646044820152637265737360e01b6064820152608401610ce4565b612c1483838361346e565b612c1f6000826125ce565b6001600160a01b0383166000908152600360205260408120805460019290612c48908490614ea7565b90915550506001600160a01b0382166000908152600360205260408120805460019290612c76908490614d92565b909155505060008181526002602052604080822080546001600160a01b0319166001600160a01b0386811691821790925591518493918716917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4505050565b6000828152600b602090815260408083206001600160a01b038516845290915290205460ff1661178657612d15816001600160a01b03166014613588565b612d20836020613588565b604051602001612d31929190615036565b60408051601f198184030181529082905262461bcd60e51b8252610ce4916004016147be565b612d6182826124e7565b6000828152600c60205260409020610e2c908261258a565b612d838282613731565b6000828152600c60205260409020610e2c90826137d2565b60c0820151612da8575050565b60008260c0015182612dba9190614e5e565b60125490915060009061271090612dee906801000000000000000090046effffffffffffffffffffffffffffff1684614e5e565b612df89190614e93565b60e08501519091506001600160a01b031673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee1415612e7857813414612e735760405162461bcd60e51b815260206004820152601660248201527f6d7573742073656e6420746f74616c2070726963652e000000000000000000006044820152606401610ce4565b612e8e565b612e8e612e836125c4565b8560e00151846137e7565b612f1f8460e00151612e9e6125c4565b60145460405163f2aab4b360e01b81523060048201526001600160a01b039091169063f2aab4b39060240160206040518083038186803b158015612ee157600080fd5b505afa158015612ef5573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190612f199190614e41565b84613963565b61223c8460e00151612f2f6125c4565b600f546001600160a01b0316612f458587614ea7565b613963565b60008281526019602052604081206002018054839290612f6b908490614d92565b9091555050601854600090612f809084614d92565b905042601a6000612f8f6125c4565b6001600160a01b0316815260208082019290925260409081016000908120858252909252812091909155601154905b83811015612fef57612fd08683613b41565b612fdb600183614d92565b9150612fe8600182614d92565b9050612fbe565b5060115550505050565b600061300482611c45565b90506130128160008461346e565b61301d6000836125ce565b6001600160a01b0381166000908152600360205260408120805460019290613046908490614ea7565b909155505060008281526002602052604080822080546001600160a01b0319169055518391906001600160a01b038416907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908390a45050565b6000611f958383613c8f565b816001600160a01b0316836001600160a01b0316141561310e5760405162461bcd60e51b815260206004820152601960248201527f4552433732313a20617070726f766520746f2063616c6c6572000000000000006044820152606401610ce4565b6001600160a01b03838116600081815260056020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b80601760010160008282546131909190614d92565b909155505050565b6060611f95838360405180606001604052806027815260200161519a60279139613cb9565b6131c8848484612b18565b6131d484848484613da4565b61223c5760405162461bcd60e51b815260206004820152603260248201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560448201527f63656976657220696d706c656d656e74657200000000000000000000000000006064820152608401610ce4565b60608161326a5750506040805180820190915260018152600360fc1b602082015290565b8160005b8115613294578061327e81614f58565b915061328d9050600a83614e93565b915061326e565b60008167ffffffffffffffff8111156132af576132af614c1d565b6040519080825280601f01601f1916602001820160405280156132d9576020820181803683370190505b5090505b8415612b10576132ee600183614ea7565b91506132fb600a866150b7565b613306906030614d92565b60f81b81838151811061331b5761331b614efb565b60200101906001600160f81b031916908160001a90535061333d600a86614e93565b94506132dd565b6000610bd7825490565b600081815260018301602052604081205461339557508154600181810184556000848152602080822090930184905584548482528286019093526040902091909155610bd7565b506000610bd7565b60006001600160e01b03198216637965db0b60e01b1480610bd75750610bd782613f0e565b600081815b84518110156134665760008582815181106133e4576133e4614efb565b60200260200101519050808311613426576040805160208101859052908101829052606001604051602081830303815290604052805190602001209250613453565b60408051602081018390529081018490526060016040516020818303038152906040528051906020012092505b508061345e81614f58565b9150506133c7565b509392505050565b613479838383613f33565b601254600160b81b900460ff16801561349a57506001600160a01b03831615155b80156134ae57506001600160a01b03821615155b15610e2c576001600160a01b03831660009081527f0a1d1818844cd1cb435b1f58baa821febb23dfe0487ae67aa143cacb2b11bba7602052604090205460ff168061353057506001600160a01b03821660009081527f0a1d1818844cd1cb435b1f58baa821febb23dfe0487ae67aa143cacb2b11bba7602052604090205460ff165b610e2c5760405162461bcd60e51b815260206004820152602360248201527f7265737472696374656420746f205452414e534645525f524f4c4520686f6c6460448201526265727360e81b6064820152608401610ce4565b60606000613597836002614e5e565b6135a2906002614d92565b67ffffffffffffffff8111156135ba576135ba614c1d565b6040519080825280601f01601f1916602001820160405280156135e4576020820181803683370190505b509050600360fc1b816000815181106135ff576135ff614efb565b60200101906001600160f81b031916908160001a905350600f60fb1b8160018151811061362e5761362e614efb565b60200101906001600160f81b031916908160001a9053506000613652846002614e5e565b61365d906001614d92565b90505b60018111156136e2577f303132333435363738396162636465660000000000000000000000000000000085600f166010811061369e5761369e614efb565b1a60f81b8282815181106136b4576136b4614efb565b60200101906001600160f81b031916908160001a90535060049490941c936136db816150cb565b9050613660565b508315611f955760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610ce4565b6000828152600b602090815260408083206001600160a01b038516845290915290205460ff1615611786576000828152600b602090815260408083206001600160a01b03851684529091529020805460ff1916905561378e6125c4565b6001600160a01b0316816001600160a01b0316837ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b60405160405180910390a45050565b6000611f95836001600160a01b038416613feb565b6040516370a0823160e01b81526001600160a01b0384811660048301528291908416906370a082319060240160206040518083038186803b15801561382b57600080fd5b505afa15801561383f573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061386391906150e2565b101580156138f15750604051636eb1769f60e11b81526001600160a01b03848116600483015230602483015282919084169063dd62ed3e9060440160206040518083038186803b1580156138b657600080fd5b505afa1580156138ca573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906138ee91906150e2565b10155b610e2c5760405162461bcd60e51b815260206004820152602b60248201527f696e73756666696369656e742063757272656e63792062616c616e6365206f7260448201527f20616c6c6f77616e63652e0000000000000000000000000000000000000000006064820152608401610ce4565b8061396d5761223c565b6001600160a01b03841673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee1415613b35576001600160a01b038316301415613a2c57604051632e1a7d4d60e01b8152600481018290527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031690632e1a7d4d90602401600060405180830381600087803b158015613a0557600080fd5b505af1158015613a19573d6000803e3d6000fd5b50505050613a2782826140de565b61223c565b6001600160a01b038216301415613b2b57348114613ab25760405162461bcd60e51b815260206004820152602d60248201527f6e617469766520746f6b656e2076616c756520646f6573206e6f74206d61746360448201527f682062696420616d6f756e742e000000000000000000000000000000000000006064820152608401610ce4565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663d0e30db0826040518263ffffffff1660e01b81526004016000604051808303818588803b158015613b0d57600080fd5b505af1158015613b21573d6000803e3d6000fd5b505050505061223c565b613a2782826140de565b61223c848484846141d5565b6001600160a01b038216613b975760405162461bcd60e51b815260206004820181905260248201527f4552433732313a206d696e7420746f20746865207a65726f20616464726573736044820152606401610ce4565b6000818152600260205260409020546001600160a01b031615613bfc5760405162461bcd60e51b815260206004820152601c60248201527f4552433732313a20746f6b656e20616c7265616479206d696e746564000000006044820152606401610ce4565b613c086000838361346e565b6001600160a01b0382166000908152600360205260408120805460019290613c31908490614d92565b909155505060008181526002602052604080822080546001600160a01b0319166001600160a01b03861690811790915590518392907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908290a45050565b6000826000018281548110613ca657613ca6614efb565b9060005260206000200154905092915050565b6060833b613d2f5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e747261637400000000000000000000000000000000000000000000000000006064820152608401610ce4565b600080856001600160a01b031685604051613d4a91906150fb565b600060405180830381855af49150503d8060008114613d85576040519150601f19603f3d011682016040523d82523d6000602084013e613d8a565b606091505b5091509150613d9a828286614481565b9695505050505050565b60006001600160a01b0384163b15613f0357836001600160a01b031663150b7a02613dcd6125c4565b8786866040518563ffffffff1660e01b8152600401613def9493929190615117565b602060405180830381600087803b158015613e0957600080fd5b505af1925050508015613e39575060408051601f3d908101601f19168201909252613e3691810190615149565b60015b613ee9573d808015613e67576040519150601f19603f3d011682016040523d82523d6000602084013e613e6c565b606091505b508051613ee15760405162461bcd60e51b815260206004820152603260248201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560448201527f63656976657220696d706c656d656e74657200000000000000000000000000006064820152608401610ce4565b805181602001fd5b6001600160e01b031916630a85bd0160e11b149050612b10565b506001949350505050565b60006001600160e01b0319821663780e9d6360e01b1480610bd75750610bd7826144ba565b6001600160a01b038316613f8e57613f8981600880546000838152600960205260408120829055600182018355919091527ff3f7a9fe364faab93b216da50a3214154f22a0a2b415b23a84c8169e8b636ee30155565b613fb1565b816001600160a01b0316836001600160a01b031614613fb157613fb1838261450a565b6001600160a01b038216613fc857610e2c816145a7565b826001600160a01b0316826001600160a01b031614610e2c57610e2c8282614656565b600081815260018301602052604081205480156140d457600061400f600183614ea7565b855490915060009061402390600190614ea7565b905081811461408857600086600001828154811061404357614043614efb565b906000526020600020015490508087600001848154811061406657614066614efb565b6000918252602080832090910192909255918252600188019052604090208390555b855486908061409957614099615166565b600190038181906000526020600020016000905590558560010160008681526020019081526020016000206000905560019350505050610bd7565b6000915050610bd7565b6000826001600160a01b03168260405160006040518083038185875af1925050503d806000811461412b576040519150601f19603f3d011682016040523d82523d6000602084013e614130565b606091505b5050905080610e2c577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663d0e30db0836040518263ffffffff1660e01b81526004016000604051808303818588803b15801561419457600080fd5b505af11580156141a8573d6000803e3d6000fd5b5050505050610e2c7f00000000000000000000000000000000000000000000000000000000000000003085855b816001600160a01b0316836001600160a01b031614156141f45761223c565b6040516370a0823160e01b81526001600160a01b038381166004830152600091908616906370a082319060240160206040518083038186803b15801561423957600080fd5b505afa15801561424d573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061427191906150e2565b905060006001600160a01b0385163014614314576040516323b872dd60e01b81526001600160a01b0386811660048301528581166024830152604482018590528716906323b872dd90606401602060405180830381600087803b1580156142d757600080fd5b505af11580156142eb573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061430f919061517c565b614396565b60405163a9059cbb60e01b81526001600160a01b0385811660048301526024820185905287169063a9059cbb90604401602060405180830381600087803b15801561435e57600080fd5b505af1158015614372573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190614396919061517c565b6040516370a0823160e01b81526001600160a01b0386811660048301529192506000918816906370a082319060240160206040518083038186803b1580156143dd57600080fd5b505afa1580156143f1573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061441591906150e2565b905081801561442c57506144298484614d92565b81145b6144785760405162461bcd60e51b815260206004820152601c60248201527f6661696c656420746f207472616e736665722063757272656e63792e000000006044820152606401610ce4565b50505050505050565b60608315614490575081611f95565b8251156144a05782518084602001fd5b8160405162461bcd60e51b8152600401610ce491906147be565b60006001600160e01b031982166380ac58cd60e01b14806144eb57506001600160e01b03198216635b5e139f60e01b145b80610bd757506301ffc9a760e01b6001600160e01b0319831614610bd7565b6000600161451784611cd0565b6145219190614ea7565b600083815260076020526040902054909150808214614574576001600160a01b03841660009081526006602090815260408083208584528252808320548484528184208190558352600790915290208190555b5060009182526007602090815260408084208490556001600160a01b039094168352600681528383209183525290812055565b6008546000906145b990600190614ea7565b600083815260096020526040812054600880549394509092849081106145e1576145e1614efb565b90600052602060002001549050806008838154811061460257614602614efb565b600091825260208083209091019290925582815260099091526040808220849055858252812055600880548061463a5761463a615166565b6001900381819060005260206000200160009055905550505050565b600061466183611cd0565b6001600160a01b039093166000908152600660209081526040808320868452825280832085905593825260079052919091209190915550565b8280546146a690614d41565b90600052602060002090601f0160209004810192826146c8576000855561470e565b82601f106146e15782800160ff1982351617855561470e565b8280016001018555821561470e579182015b8281111561470e5782358255916020019190600101906146f3565b5061471a92915061471e565b5090565b5b8082111561471a576000815560010161471f565b6001600160e01b031981168114611a6657600080fd5b60006020828403121561475b57600080fd5b8135611f9581614733565b60005b83811015614781578181015183820152602001614769565b8381111561223c5750506000910152565b600081518084526147aa816020860160208601614766565b601f01601f19169290920160200192915050565b602081526000611f956020830184614792565b6000602082840312156147e357600080fd5b5035919050565b6001600160a01b0381168114611a6657600080fd5b6000806040838503121561481257600080fd5b823561481d816147ea565b946020939093013593505050565b60008083601f84011261483d57600080fd5b50813567ffffffffffffffff81111561485557600080fd5b6020830191508360208260051b850101111561487057600080fd5b9250929050565b60008060008060006080868803121561488f57600080fd5b853561489a816147ea565b945060208601359350604086013567ffffffffffffffff8111156148bd57600080fd5b6148c98882890161482b565b96999598509660600135949350505050565b6000602082840312156148ed57600080fd5b8135611f95816147ea565b6000806020838503121561490b57600080fd5b823567ffffffffffffffff8082111561492357600080fd5b818501915085601f83011261493757600080fd5b81358181111561494657600080fd5b8660208260081b850101111561495b57600080fd5b60209290920196919550909350505050565b60008060006060848603121561498257600080fd5b833561498d816147ea565b9250602084013561499d816147ea565b929592945050506040919091013590565b600080604083850312156149c157600080fd5b50508035926020909101359150565b600080604083850312156149e357600080fd5b8235915060208301356149f5816147ea565b809150509250929050565b60008060008060608587031215614a1657600080fd5b8435614a21816147ea565b935060208501359250604085013567ffffffffffffffff811115614a4457600080fd5b614a508782880161482b565b95989497509550505050565b60008083601f840112614a6e57600080fd5b50813567ffffffffffffffff811115614a8657600080fd5b60208301915083602082850101111561487057600080fd5b600080600060408486031215614ab357600080fd5b83359250602084013567ffffffffffffffff811115614ad157600080fd5b614add86828701614a5c565b9497909650939450505050565b8015158114611a6657600080fd5b600060208284031215614b0a57600080fd5b8135611f9581614aea565b60008060208385031215614b2857600080fd5b823567ffffffffffffffff811115614b3f57600080fd5b614b4b85828601614a5c565b90969095509350505050565b60008060408385031215614b6a57600080fd5b8235614b75816147ea565b915060208301356149f581614aea565b60008060208385031215614b9857600080fd5b823567ffffffffffffffff811115614baf57600080fd5b614b4b8582860161482b565b6000602080830181845280855180835260408601915060408160051b870101925083870160005b82811015614c1057603f19888603018452614bfe858351614792565b94509285019290850190600101614be2565b5092979650505050505050565b634e487b7160e01b600052604160045260246000fd5b60008060008060808587031215614c4957600080fd5b8435614c54816147ea565b93506020850135614c64816147ea565b925060408501359150606085013567ffffffffffffffff80821115614c8857600080fd5b818701915087601f830112614c9c57600080fd5b813581811115614cae57614cae614c1d565b604051601f8201601f19908116603f01168101908382118183101715614cd657614cd6614c1d565b816040528281528a6020848701011115614cef57600080fd5b82602086016020830137600060208483010152809550505050505092959194509250565b60008060408385031215614d2657600080fd5b8235614d31816147ea565b915060208301356149f5816147ea565b600181811c90821680614d5557607f821691505b60208210811415614d7657634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b60008219821115614da557614da5614d7c565b500190565b6020808252818101839052600090604080840186845b87811015614e34578135835284820135858401528382013584840152606080830135908401526080808301359084015260a0808301359084015260c0808301359084015260e080830135614e13816147ea565b6001600160a01b031690840152610100928301929190910190600101614dc0565b5090979650505050505050565b600060208284031215614e5357600080fd5b8151611f95816147ea565b6000816000190483118215151615614e7857614e78614d7c565b500290565b634e487b7160e01b600052601260045260246000fd5b600082614ea257614ea2614e7d565b500490565b600082821015614eb957614eb9614d7c565b500390565b84815283602082015260606040820152816060820152818360808301376000818301608090810191909152601f909201601f191601019392505050565b634e487b7160e01b600052603260045260246000fd5b6000808335601e19843603018112614f2857600080fd5b83018035915067ffffffffffffffff821115614f4357600080fd5b60200191503681900382131561487057600080fd5b6000600019821415614f6c57614f6c614d7c565b5060010190565b60008151614f85818560208601614766565b9290920192915050565b600080845481600182811c915080831680614fab57607f831692505b6020808410821415614fcb57634e487b7160e01b86526022600452602486fd5b818015614fdf5760018114614ff05761501d565b60ff1986168952848901965061501d565b60008b81526020902060005b868110156150155781548b820152908501908301614ffc565b505084890196505b50505050505061502d8185614f73565b95945050505050565b7f416363657373436f6e74726f6c3a206163636f756e742000000000000000000081526000835161506e816017850160208801614766565b7f206973206d697373696e6720726f6c652000000000000000000000000000000060179184019182015283516150ab816028840160208801614766565b01602801949350505050565b6000826150c6576150c6614e7d565b500690565b6000816150da576150da614d7c565b506000190190565b6000602082840312156150f457600080fd5b5051919050565b6000825161510d818460208701614766565b9190910192915050565b60006001600160a01b03808716835280861660208401525083604083015260806060830152613d9a6080830184614792565b60006020828403121561515b57600080fd5b8151611f9581614733565b634e487b7160e01b600052603160045260246000fd5b60006020828403121561518e57600080fd5b8151611f9581614aea56fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a164736f6c6343000809000a";
}
