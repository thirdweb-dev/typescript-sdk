/* tslint:disable */
/* eslint-disable */

export class Marketplace__factory {
  static readonly abi = [
    {
      inputs: [
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
          internalType: "string",
          name: "_uri",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "_marketFeeBps",
          type: "uint256",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "timeBuffer",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "bidBufferBps",
          type: "uint256",
        },
      ],
      name: "AuctionBuffersUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "listingId",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "address",
          name: "closer",
          type: "address",
        },
        {
          indexed: true,
          internalType: "bool",
          name: "cancelled",
          type: "bool",
        },
        {
          indexed: false,
          internalType: "address",
          name: "auctionCreator",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "winningBidder",
          type: "address",
        },
      ],
      name: "AuctionClosed",
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
      name: "ListingRestricted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "listingId",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "address",
          name: "listingCreator",
          type: "address",
        },
      ],
      name: "ListingUpdate",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint64",
          name: "newFee",
          type: "uint64",
        },
      ],
      name: "MarketFeeUpdate",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "listingId",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "address",
          name: "assetContract",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "lister",
          type: "address",
        },
        {
          components: [
            {
              internalType: "uint256",
              name: "listingId",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "tokenOwner",
              type: "address",
            },
            {
              internalType: "address",
              name: "assetContract",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "startTime",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "endTime",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantity",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "currency",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "reservePricePerToken",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "buyoutPricePerToken",
              type: "uint256",
            },
            {
              internalType: "enum IMarketplace.TokenType",
              name: "tokenType",
              type: "uint8",
            },
            {
              internalType: "enum IMarketplace.ListingType",
              name: "listingType",
              type: "uint8",
            },
          ],
          indexed: false,
          internalType: "struct IMarketplace.Listing",
          name: "listing",
          type: "tuple",
        },
      ],
      name: "NewListing",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "listingId",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "address",
          name: "offeror",
          type: "address",
        },
        {
          indexed: true,
          internalType: "enum IMarketplace.ListingType",
          name: "listingType",
          type: "uint8",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "quantityWanted",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "totalOfferAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "currency",
          type: "address",
        },
      ],
      name: "NewOffer",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "listingId",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "address",
          name: "assetContract",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "lister",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "buyer",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "quantityBought",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "totalPricePaid",
          type: "uint256",
        },
      ],
      name: "NewSale",
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
      name: "LISTER_ROLE",
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
      name: "MAX_BPS",
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
      inputs: [
        {
          internalType: "uint256",
          name: "_listingId",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "offeror",
          type: "address",
        },
      ],
      name: "acceptOffer",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "bidBufferBps",
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
          name: "_listingId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_quantityToBuy",
          type: "uint256",
        },
      ],
      name: "buy",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_listingId",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_closeFor",
          type: "address",
        },
      ],
      name: "closeAuction",
      outputs: [],
      stateMutability: "nonpayable",
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
      inputs: [
        {
          components: [
            {
              internalType: "address",
              name: "assetContract",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "startTime",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "secondsUntilEndTime",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "quantityToList",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "currencyToAccept",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "reservePricePerToken",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "buyoutPricePerToken",
              type: "uint256",
            },
            {
              internalType: "enum IMarketplace.ListingType",
              name: "listingType",
              type: "uint8",
            },
          ],
          internalType: "struct IMarketplace.ListingParameters",
          name: "_params",
          type: "tuple",
        },
      ],
      name: "createListing",
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
          name: "",
          type: "uint256",
        },
      ],
      name: "listings",
      outputs: [
        {
          internalType: "uint256",
          name: "listingId",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "tokenOwner",
          type: "address",
        },
        {
          internalType: "address",
          name: "assetContract",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "startTime",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "endTime",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "quantity",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "currency",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "reservePricePerToken",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "buyoutPricePerToken",
          type: "uint256",
        },
        {
          internalType: "enum IMarketplace.TokenType",
          name: "tokenType",
          type: "uint8",
        },
        {
          internalType: "enum IMarketplace.ListingType",
          name: "listingType",
          type: "uint8",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "marketFeeBps",
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
      inputs: [
        {
          internalType: "uint256",
          name: "_listingId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_quantityWanted",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_currency",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "_pricePerToken",
          type: "uint256",
        },
      ],
      name: "offer",
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
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "offers",
      outputs: [
        {
          internalType: "uint256",
          name: "listingId",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "offeror",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "quantityWanted",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "currency",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "pricePerToken",
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
          name: "",
          type: "address",
        },
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]",
        },
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]",
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes",
        },
      ],
      name: "onERC1155BatchReceived",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes",
        },
      ],
      name: "onERC1155Received",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes",
        },
      ],
      name: "onERC721Received",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4",
        },
      ],
      stateMutability: "pure",
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
      inputs: [],
      name: "restrictedListerRoleOnly",
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
      inputs: [
        {
          internalType: "uint256",
          name: "_timeBuffer",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_bidBufferBps",
          type: "uint256",
        },
      ],
      name: "setAuctionBuffers",
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
          internalType: "uint256",
          name: "_feeBps",
          type: "uint256",
        },
      ],
      name: "setMarketFeeBps",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bool",
          name: "restricted",
          type: "bool",
        },
      ],
      name: "setRestrictedListerRoleOnly",
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
      name: "timeBuffer",
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
      inputs: [],
      name: "totalListings",
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
          name: "_listingId",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_quantityToList",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_reservePricePerToken",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_buyoutPricePerToken",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_currencyToAccept",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "_startTime",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_secondsUntilEndTime",
          type: "uint256",
        },
      ],
      name: "updateListing",
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
      name: "winningBid",
      outputs: [
        {
          internalType: "uint256",
          name: "listingId",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "offeror",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "quantityWanted",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "currency",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "pricePerToken",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      stateMutability: "payable",
      type: "receive",
    },
  ];
  static readonly bytecode =
    "0x60a060405260078054600160481b600160c81b0319167201f400000000000003840000000000000000001790553480156200003957600080fd5b5060405162005b7c38038062005b7c8339810160408190526200005c91620003bc565b6001600255600380546001600160a01b0319166001600160a01b038616179055815162000091906006906020850190620002e7565b50600480546001600160a01b0319166001600160a01b0387811691909117909155831660805260078054610100600160481b0319166101006001600160401b03841602179055620000ed6000620000e762000127565b62000143565b6200011c7ff94103142c1baabe9ac2b5d1487bf783de9e69cfeea9a72f5c9c94afd7877b8c620000e762000127565b505050505062000523565b60006200013e6200015360201b6200242b1760201c565b905090565b6200014f82826200018c565b5050565b6003546000906001600160a01b031633141562000177575060131936013560601c90565b6200013e620001cf60201b620024581760201c565b620001a38282620001d360201b6200245c1760201c565b6000828152600160209081526040909120620001ca918390620024fb62000275821b17901c565b505050565b3390565b6000828152602081815260408083206001600160a01b038516845290915290205460ff166200014f576000828152602081815260408083206001600160a01b03851684529091529020805460ff191660011790556200023162000127565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b60006200028c836001600160a01b03841662000295565b90505b92915050565b6000818152600183016020526040812054620002de575081546001818101845560008481526020808220909301849055845484825282860190935260409020919091556200028f565b5060006200028f565b828054620002f590620004e6565b90600052602060002090601f01602090048101928262000319576000855562000364565b82601f106200033457805160ff191683800117855562000364565b8280016001018555821562000364579182015b828111156200036457825182559160200191906001019062000347565b506200037292915062000376565b5090565b5b8082111562000372576000815560010162000377565b6001600160a01b0381168114620003a357600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b600080600080600060a08688031215620003d557600080fd5b8551620003e2816200038d565b80955050602080870151620003f7816200038d565b60408801519095506200040a816200038d565b60608801519094506001600160401b03808211156200042857600080fd5b818901915089601f8301126200043d57600080fd5b815181811115620004525762000452620003a6565b604051601f8201601f19908116603f011681019083821181831017156200047d576200047d620003a6565b816040528281528c868487010111156200049657600080fd5b600093505b82841015620004ba57848401860151818501870152928501926200049b565b82841115620004cc5760008684830101525b809750505050505050608086015190509295509295909350565b600181811c90821680620004fb57607f821691505b602082108114156200051d57634e487b7160e01b600052602260045260246000fd5b50919050565b60805161561a620005626000396000818161090001528181611a3b0152818161425a01528181614355015281816146e7015261475e015261561a6000f3fe60806040526004361061026e5760003560e01c8063ac9650d811610153578063de74e57b116100cb578063ebdfbce51161007f578063f23a6e6111610064578063f23a6e61146108c2578063f9ea29cb146108ee578063fd967f471461092257600080fd5b8063ebdfbce514610834578063ec91f2a41461089457600080fd5b8063e4104eaf116100b0578063e4104eaf146107d2578063e8a3d485146107f2578063ea0e02411461081457600080fd5b8063de74e57b146106f9578063deb26b941461079e57600080fd5b8063c78b616c11610122578063d4ac9b8c11610107578063d4ac9b8c1461063f578063d547741f146106c6578063d6febde8146106e657600080fd5b8063c78b616c14610609578063ca15c8731461061f57600080fd5b8063ac9650d81461057d578063acb1ba67146105aa578063bc197c81146105bd578063c4b5b15f146105e957600080fd5b80634e03f28d116101e65780639010d07c116101b557806391d148541161019a57806391d1485414610504578063938e3d7b14610548578063a217fddf1461056857600080fd5b80639010d07c146104c4578063918d407d146104e457600080fd5b80634e03f28d14610433578063572b6c051461045b57806361096ec61461048a5780636bab66ae146104a457600080fd5b80632f2ff15d1161023d578063354c7ab611610222578063354c7ab6146103b457806336568abe146103d45780633f5c3e87146103f457600080fd5b80632f2ff15d1461035457806331f7d9641461037457600080fd5b806301ffc9a71461027a578063150b7a02146102af578063248a9ca3146102f4578063296f4e161461033257600080fd5b3661027557005b600080fd5b34801561028657600080fd5b5061029a610295366004614ae3565b610938565b60405190151581526020015b60405180910390f35b3480156102bb57600080fd5b506102db6102ca366004614b79565b630a85bd0160e11b95945050505050565b6040516001600160e01b031990911681526020016102a6565b34801561030057600080fd5b5061032461030f366004614bec565b60009081526020819052604090206001015490565b6040519081526020016102a6565b34801561033e57600080fd5b5061035261034d366004614c85565b61098a565b005b34801561036057600080fd5b5061035261036f366004614d11565b610de1565b34801561038057600080fd5b5061039c73eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee81565b6040516001600160a01b0390911681526020016102a6565b3480156103c057600080fd5b506103526103cf366004614d4f565b610e13565b3480156103e057600080fd5b506103526103ef366004614d11565b610eb4565b34801561040057600080fd5b5060075461041a90610100900467ffffffffffffffff1681565b60405167ffffffffffffffff90911681526020016102a6565b34801561043f57600080fd5b5060075461041a90600160881b900467ffffffffffffffff1681565b34801561046757600080fd5b5061029a610476366004614d6c565b6003546001600160a01b0391821691161490565b34801561049657600080fd5b5060075461029a9060ff1681565b3480156104b057600080fd5b506103526104bf366004614d11565b610f50565b3480156104d057600080fd5b5061039c6104df366004614d89565b611272565b3480156104f057600080fd5b506103526104ff366004614d11565b611291565b34801561051057600080fd5b5061029a61051f366004614d11565b6000918252602082815260408084206001600160a01b0393909316845291905290205460ff1690565b34801561055457600080fd5b50610352610563366004614dab565b611547565b34801561057457600080fd5b50610324600081565b34801561058957600080fd5b5061059d610598366004614ded565b6116a8565b6040516102a69190614eba565b6103526105b8366004614f1c565b61179d565b3480156105c957600080fd5b506102db6105d836600461504b565b63bc197c8160e01b95945050505050565b3480156105f557600080fd5b506103526106043660046150f9565b611a95565b34801561061557600080fd5b5061032460055481565b34801561062b57600080fd5b5061032461063a366004614bec565b611f71565b34801561064b57600080fd5b5061069461065a366004614bec565b600a602052600090815260409020805460018201546002830154600384015460049094015492936001600160a01b03928316939192169085565b604080519586526001600160a01b0394851660208701528501929092529091166060830152608082015260a0016102a6565b3480156106d257600080fd5b506103526106e1366004614d11565b611f88565b6103526106f4366004614d89565b611fb0565b34801561070557600080fd5b50610786610714366004614bec565b600860208190526000918252604090912080546001820154600283015460038401546004850154600586015460068701546007880154988801546009890154600a9099015497996001600160a01b03978816999688169895979496939592941692909160ff808216916101009004168c565b6040516102a69c9b9a99989796959493929190615199565b3480156107aa57600080fd5b506103247ff94103142c1baabe9ac2b5d1487bf783de9e69cfeea9a72f5c9c94afd7877b8c81565b3480156107de57600080fd5b506103526107ed366004614bec565b61213f565b3480156107fe57600080fd5b50610807612241565b6040516102a6919061521d565b34801561082057600080fd5b5061035261082f366004614d89565b6122cf565b34801561084057600080fd5b5061069461084f366004614d11565b60096020908152600092835260408084209091529082529020805460018201546002830154600384015460049094015492936001600160a01b03928316939192169085565b3480156108a057600080fd5b5060075461041a906901000000000000000000900467ffffffffffffffff1681565b3480156108ce57600080fd5b506102db6108dd366004615230565b63f23a6e6160e01b95945050505050565b3480156108fa57600080fd5b5061039c7f000000000000000000000000000000000000000000000000000000000000000081565b34801561092e57600080fd5b5061041a61271081565b60006001600160e01b03198216630271189760e51b148061096957506001600160e01b03198216630a85bd0160e11b145b8061098457506001600160e01b0319821663152a902d60e11b145b92915050565b60075460ff1615806109c357506109c37ff94103142c1baabe9ac2b5d1487bf783de9e69cfeea9a72f5c9c94afd7877b8c61051f612510565b610a3a5760405162461bcd60e51b815260206004820152602e60248201527f4d61726b6574706c6163653a2063616c6c657220646f6573206e6f742068617660448201527f65204c49535445525f524f4c452e00000000000000000000000000000000000060648201526084015b60405180910390fd5b6000816060015111610ab45760405162461bcd60e51b815260206004820152603860248201527f4d61726b6574706c6163653a207365636f6e6473556e74696c456e6454696d6560448201527f206d7573742062652067726561746572207468616e20302e00000000000000006064820152608401610a31565b6000610abe61251a565b90506000610aca612510565b90506000610adb8460000151612538565b90506000610aed8286608001516126c4565b905060008111610b655760405162461bcd60e51b815260206004820152602660248201527f4d61726b6574706c6163653a206c697374696e6720696e76616c69642071756160448201527f6e746974792e00000000000000000000000000000000000000000000000000006064820152608401610a31565b610b7a838660000151876020015184866126fb565b600042866040015110610b91578560400151610b93565b425b90506000604051806101800160405280878152602001866001600160a01b0316815260200188600001516001600160a01b0316815260200188602001518152602001838152602001886060015184610beb91906152af565b81526020018481526020018860a001516001600160a01b031681526020018860c0015181526020018860e001518152602001856001811115610c2f57610c2f615158565b81526020018861010001516001811115610c4b57610c4b615158565b90526000878152600860208181526040928390208451815590840151600180830180546001600160a01b03199081166001600160a01b0394851617909155948601516002840180548716918416919091179055606086015160038401556080860151600484015560a0860151600584015560c0860151600684015560e0860151600784018054909616921691909117909355610100840151918101919091556101208301516009820155610140830151600a82018054949550859492939192909160ff19909116908381811115610d2457610d24615158565b0217905550610160820151600a8201805461ff001916610100836001811115610d4f57610d4f615158565b021790555060019150610d5f9050565b8161016001516001811115610d7657610d76615158565b1415610d8857610d8885308584612a5e565b846001600160a01b031687600001516001600160a01b0316877f9e578277632a71dd17ab11c1f584c51deafef022c94389ecb050eb92713725f684604051610dd091906152c7565b60405180910390a450505050505050565b600082815260208190526040902060010154610e0481610dff612510565b612bb0565b610e0e8383612c2e565b505050565b610e20600061051f612510565b610e6c5760405162461bcd60e51b815260206004820181905260248201527f4d61726b6574706c6163653a206e6f742061206d6f64756c652061646d696e2e6044820152606401610a31565b6007805460ff19168215159081179091556040519081527f80b4303f755d7d3d4d483a1580281ef7aaeb82947826a1dc63a6366875765cb0906020015b60405180910390a150565b610ebc612510565b6001600160a01b0316816001600160a01b031614610f425760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201527f20726f6c657320666f722073656c6600000000000000000000000000000000006064820152608401610a31565b610f4c8282612c50565b5050565b600280541415610fa25760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c006044820152606401610a31565b60028080556000838152600860208181526040808420815161018081018352815481526001808301546001600160a01b0390811695830195909552968201548416928101929092526003810154606083015260048101546080830152600581015460a0830152600681015460c0830152600781015490921660e0820152918101546101008301526009810154610120830152600a81015492939192909161014084019160ff169081111561105857611058615158565b600181111561106957611069615158565b8152602001600a820160019054906101000a900460ff16600181111561109157611091615158565b60018111156110a2576110a2615158565b9052509050600181610160015160018111156110c0576110c0615158565b1461110d5760405162461bcd60e51b815260206004820152601c60248201527f4d61726b6574706c6163653a206e6f7420616e2061756374696f6e2e000000006044820152606401610a31565b6000838152600a60209081526040808320815160a0810183528154815260018201546001600160a01b039081169482019490945260028201549281019290925260038101549092166060820152600490910154608080830191909152830151909190421080611187575060208201516001600160a01b0316155b9050801561119d5761119883612c72565b611266565b428360a00151106112165760405162461bcd60e51b815260206004820152603660248201527f4d61726b6574706c6163653a2063616e6e6f7420636c6f73652061756374696f60448201527f6e206265666f72652069742068617320656e6465642e000000000000000000006064820152608401610a31565b82602001516001600160a01b0316846001600160a01b0316141561123e5761123e8383612df4565b81602001516001600160a01b0316846001600160a01b0316141561126657611266838361300f565b50506001600255505050565b600082815260016020526040812061128a9083613215565b9392505050565b6002805414156112e35760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c006044820152606401610a31565b60028055816112f0612510565b6000828152600860205260409020600101546001600160a01b039081169116146113705760405162461bcd60e51b815260206004820152602b60248201527f4d61726b6574706c6163653a2063616c6c6572206973206e6f74206c6973746960448201526a37339031b932b0ba37b91760a91b6064820152608401610a31565b60008381526009602081815260408084206001600160a01b038088168652908352818520825160a08082018552825482526001808401548516838801526002808501548488015260038086015487166060808701919091526004968701546080808801919091528f8d526008808c528a8e208b5161018081018d5281548152818801548c169d81019d909d52948501548a169a8c019a909a5291830154908a01529481015494880194909452600584015491870191909152600683015460c0870152600783015490931660e08601529281015461010085015293840154610120840152600a8401549194939161014084019160ff9091169081111561147757611477615158565b600181111561148857611488615158565b8152602001600a820160019054906101000a900460ff1660018111156114b0576114b0615158565b60018111156114c1576114c1615158565b90525060008681526009602090815260408083206001600160a01b03891684529091528082208281556001810180546001600160a01b03199081169091556002820184905560038201805490911690556004019190915560608401519084015160808501519293506112669284928892909161153d9190615390565b8660400151613221565b600480546040805163a217fddf60e01b815290516001600160a01b03909216926391d1485492849263a217fddf9281810192602092909190829003018186803b15801561159357600080fd5b505afa1580156115a7573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115cb91906153af565b6115d3612510565b6040516001600160e01b031960e085901b16815260048101929092526001600160a01b0316602482015260440160206040518083038186803b15801561161857600080fd5b505afa15801561162c573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061165091906153c8565b61169c5760405162461bcd60e51b815260206004820181905260248201527f4d61726b6574706c6163653a206e6f742070726f746f636f6c2061646d696e2e6044820152606401610a31565b610e0e60068383614a4a565b60608167ffffffffffffffff8111156116c3576116c3614c05565b6040519080825280602002602001820160405280156116f657816020015b60608152602001906001900390816116e15790505b50905060005b82811015611796576117663085858481811061171a5761171a6153e5565b905060200281019061172c91906153fb565b8080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152506133cb92505050565b828281518110611778576117786153e5565b6020026020010181905250808061178e90615442565b9150506116fc565b5092915050565b6002805414156117ef5760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c006044820152606401610a31565b60028080556000858152600860208181526040808420815161018081018352815481526001808301546001600160a01b0390811695830195909552968201548416928101929092526003810154606083015260048101546080830152600581015460a0830152600681015460c0830152600781015490921660e0820152918101546101008301526009810154610120830152600a81015492939192909161014084019160ff16908111156118a5576118a5615158565b60018111156118b6576118b6615158565b8152602001600a820160019054906101000a900460ff1660018111156118de576118de615158565b60018111156118ef576118ef615158565b815250509050428160a0015111801561190b5750428160800151105b6119575760405162461bcd60e51b815260206004820152601e60248201527f4d61726b6574706c6163653a20696e616374697665206c697374696e672e00006044820152606401610a31565b60006040518060a00160405280878152602001611972612510565b6001600160a01b03908116825260208201889052861660408201526060018490529050600182610160015160018111156119ae576119ae615158565b14156119f05760e08201516001600160a01b0316606082015261014082015160c08301516119dc91906126c4565b60408201526119eb82826133f0565b611a88565b60008261016001516001811115611a0957611a09615158565b1415611a88576001600160a01b03841673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee14611a395783611a5b565b7f00000000000000000000000000000000000000000000000000000000000000005b6001600160a01b03166060820152610140820151611a7990866126c4565b6040820152611a8882826137c0565b5050600160025550505050565b86611a9e612510565b6000828152600860205260409020600101546001600160a01b03908116911614611b1e5760405162461bcd60e51b815260206004820152602b60248201527f4d61726b6574706c6163653a2063616c6c6572206973206e6f74206c6973746960448201526a37339031b932b0ba37b91760a91b6064820152608401610a31565b6000888152600860208181526040808420815161018081018352815481526001808301546001600160a01b039081169583019590955260028301548516938201939093526003820154606082015260048201546080820152600582015460a0820152600682015460c0820152600782015490931660e0840152928301546101008301526009830154610120830152600a83015491929161014084019160ff90911690811115611bcf57611bcf615158565b6001811115611be057611be0615158565b8152602001600a820160019054906101000a900460ff166001811115611c0857611c08615158565b6001811115611c1957611c19615158565b8152505090506000611c308261014001518a6126c4565b9050600060018361016001516001811115611c4d57611c4d615158565b1490508015611ccf5782608001514210611ccf5760405162461bcd60e51b815260206004820152602560248201527f4d61726b6574706c6163653a2061756374696f6e20616c72656164792073746160448201527f727465642e0000000000000000000000000000000000000000000000000000006064820152608401610a31565b60008615611cdd5786611ce3565b83608001515b90506040518061018001604052808d8152602001611cff612510565b6001600160a01b0316815260200185604001516001600160a01b031681526020018560600151815260200182815260200187600014611d4757611d4288846152af565b611d4d565b8560a001515b8152602001848152602001896001600160a01b031681526020018b81526020018a81526020018561014001516001811115611d8a57611d8a615158565b81526020018561016001516001811115611da657611da6615158565b905260008d8152600860208181526040928390208451815590840151600180830180546001600160a01b03199081166001600160a01b0394851617909155948601516002840180548716918416919091179055606086015160038401556080860151600484015560a0860151600584015560c0860151600684015560e0860151600784018054909616921691909117909355610100840151918101919091556101208301516009820155610140830151600a8201805492939192909160ff19909116908381811115611e7a57611e7a615158565b0217905550610160820151600a8201805461ff001916610100836001811115611ea557611ea5615158565b0217905550505060c08401518314611f2757818015611ec2575082155b15611ed957611ed084612c72565b50505050611f67565b8115611ef357611ef33085602001518660c0015187612a5e565b611f11846020015185604001518660600151868861014001516126fb565b8115611f2757611f278460200151308587612a5e565b83602001516001600160a01b03168c7fa00227275ba75aea329d91406a2884d227dc386f939f1d18e15a7317152432ca60405160405180910390a3505050505b5050505050505050565b60008181526001602052604081206109849061397b565b600082815260208190526040902060010154611fa681610dff612510565b610e0e8383612c50565b6002805414156120025760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c006044820152606401610a31565b60028080556000838152600860208181526040808420815161018081018352815481526001808301546001600160a01b0390811695830195909552968201548416928101929092526003810154606083015260048101546080830152600581015460a0830152600681015460c0830152600781015490921660e0820152918101546101008301526009810154610120830152600a81015492939192909161014084019160ff16908111156120b8576120b8615158565b60018111156120c9576120c9615158565b8152602001600a820160019054906101000a900460ff1660018111156120f1576120f1615158565b600181111561210257612102615158565b90525090506000612111612510565b905061213482828460e001518686610120015161212e9190615390565b87613221565b505060016002555050565b61214c600061051f612510565b6121985760405162461bcd60e51b815260206004820181905260248201527f4d61726b6574706c6163653a206e6f742061206d6f64756c652061646d696e2e6044820152606401610a31565b61271081106121e95760405162461bcd60e51b815260206004820152601960248201527f4d61726b6574706c6163653a20696e76616c6964204250532e000000000000006044820152606401610a31565b6007805468ffffffffffffffff00191661010067ffffffffffffffff8416908102919091179091556040519081527f1923ecef8dbc1cebea2768819f7df282b72fb6d62bf99da204590b9d5cac7a7b90602001610ea9565b6006805461224e9061545d565b80601f016020809104026020016040519081016040528092919081815260200182805461227a9061545d565b80156122c75780601f1061229c576101008083540402835291602001916122c7565b820191906000526020600020905b8154815290600101906020018083116122aa57829003601f168201915b505050505081565b6122dc600061051f612510565b6123285760405162461bcd60e51b815260206004820181905260248201527f4d61726b6574706c6163653a206e6f742061206d6f64756c652061646d696e2e6044820152606401610a31565b61271081106123795760405162461bcd60e51b815260206004820152601960248201527f4d61726b6574706c6163653a20696e76616c6964204250532e000000000000006044820152606401610a31565b6007805467ffffffffffffffff838116600160881b027fffffffffffffff0000000000000000ffffffffffffffffffffffffffffffffff918616690100000000000000000002919091167fffffffffffffff00000000000000000000000000000000ffffffffffffffffff9092169190911717905560408051838152602081018390527f441ed6470e96704c3f8c9e70c209107078aab3f17311385e886081b91aa75088910160405180910390a15050565b6003546000906001600160a01b031633141561244e575060131936013560601c90565b503390565b905090565b3390565b6000828152602081815260408083206001600160a01b038516845290915290205460ff16610f4c576000828152602081815260408083206001600160a01b03851684529091529020805460ff191660011790556124b7612510565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b600061128a836001600160a01b038416613985565b600061245361242b565b6005805490600190600061252e83856152af565b9250508190555090565b6040516301ffc9a760e01b8152636cdb3d1360e11b60048201526000906001600160a01b038316906301ffc9a79060240160206040518083038186803b15801561258157600080fd5b505afa158015612595573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906125b991906153c8565b156125c657506000919050565b6040516301ffc9a760e01b81526380ac58cd60e01b60048201526001600160a01b038316906301ffc9a79060240160206040518083038186803b15801561260c57600080fd5b505afa158015612620573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061264491906153c8565b1561265157506001919050565b60405162461bcd60e51b815260206004820152603060248201527f4d61726b6574706c6163653a206d75737420696d706c656d656e74204552432060448201527f31313535206f7220455243203732312e000000000000000000000000000000006064820152608401610a31565b919050565b6000816126d357506000610984565b60018360018111156126e7576126e7615158565b146126f2578161128a565b50600192915050565b3060008083600181111561271157612711615158565b141561282957604051627eeac760e11b81526001600160a01b0388811660048301526024820187905285919088169062fdd58e9060440160206040518083038186803b15801561276057600080fd5b505afa158015612774573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061279891906153af565b10158015612822575060405163e985e9c560e01b81526001600160a01b038881166004830152838116602483015287169063e985e9c59060440160206040518083038186803b1580156127ea57600080fd5b505afa1580156127fe573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061282291906153c8565b90506129e2565b600183600181111561283d5761283d615158565b14156129e2576040516331a9108f60e11b8152600481018690526001600160a01b038089169190881690636352211e9060240160206040518083038186803b15801561288857600080fd5b505afa15801561289c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906128c09190615498565b6001600160a01b03161480156129df575060405163020604bf60e21b8152600481018690526001600160a01b03808416919088169063081812fc9060240160206040518083038186803b15801561291657600080fd5b505afa15801561292a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061294e9190615498565b6001600160a01b031614806129df575060405163e985e9c560e01b81526001600160a01b038881166004830152838116602483015287169063e985e9c59060440160206040518083038186803b1580156129a757600080fd5b505afa1580156129bb573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906129df91906153c8565b90505b80612a555760405162461bcd60e51b815260206004820152603460248201527f4d61726b6574706c6163653a20696e73756666696369656e7420746f6b656e2060448201527f62616c616e6365206f7220617070726f76616c2e0000000000000000000000006064820152608401610a31565b50505050505050565b60008161014001516001811115612a7757612a77615158565b1415612b0c5760408082015160608301519151637921219560e11b81526001600160a01b038781166004830152868116602483015260448201939093526064810185905260a06084820152600060a482015291169063f242432a9060c401600060405180830381600087803b158015612aef57600080fd5b505af1158015612b03573d6000803e3d6000fd5b50505050612baa565b60018161014001516001811115612b2557612b25615158565b1415612baa5760408082015160608301519151635c46a7ef60e11b81526001600160a01b03878116600483015286811660248301526044820193909352608060648201526000608482015291169063b88d4fde9060a401600060405180830381600087803b158015612b9657600080fd5b505af1158015611f67573d6000803e3d6000fd5b50505050565b6000828152602081815260408083206001600160a01b038516845290915290205460ff16610f4c57612bec816001600160a01b031660146139d4565b612bf78360206139d4565b604051602001612c089291906154b5565b60408051601f198184030181529082905262461bcd60e51b8252610a319160040161521d565b612c38828261245c565b6000828152600160205260409020610e0e90826124fb565b612c5a8282613b7d565b6000828152600160205260409020610e0e9082613c1a565b612c7a612510565b81516000908152600860205260409020600101546001600160a01b03908116911614612d0e5760405162461bcd60e51b815260206004820152602f60248201527f4d61726b6574706c6163653a2063616c6c6572206973206e6f7420746865206c60448201527f697374696e672063726561746f722e00000000000000000000000000000000006064820152608401610a31565b8051600090815260086020818152604083208381556001810180546001600160a01b0319908116909155600282018054821690556003820185905560048201859055600582018590556006820185905560078201805490911690559182018390556009820192909255600a01805461ffff1916905581015160c0820151612d9791309184612a5e565b6001612da1612510565b8251602080850151604080516001600160a01b0392831681526000938101939093529316927f572cdc5ca5e918473319d0f4737494e4709ac879a7d0bcd11ce1bef24b24e81d910160405180910390a450565b60008260c001518260800151612e0a9190615390565b600060c085018181524260a0870190815286518352600860208181526040948590208951815590890151600180830180546001600160a01b039384166001600160a01b031991821617909155968b015160028401805491841691891691909117905560608b0151600384015560808b01516004840155935160058301559351600682015560e089015160078201805491909516951694909417909255610100870151918301919091556101208601516009830155610140860151600a8301805494955087949192909160ff1916908381811115612ee957612ee9615158565b0217905550610160820151600a8201805461ff001916610100836001811115612f1457612f14615158565b02179055505060006080840181815285518252600a602090815260409283902086518155818701516001820180546001600160a01b03199081166001600160a01b03938416179091559488015160028301556060880151600383018054909616911617909355905160049092019190915584015160e0850151612f9c92503091908487613c2f565b6000612fa6612510565b6001600160a01b031684600001517f572cdc5ca5e918473319d0f4737494e4709ac879a7d0bcd11ce1bef24b24e81d866020015186602001516040516130029291906001600160a01b0392831681529116602082015260400190565b60405180910390a4505050565b600081604001519050428360a0018181525050600082604001818152505081600a6000856000015181526020019081526020016000206000820151816000015560208201518160010160006101000a8154816001600160a01b0302191690836001600160a01b031602179055506040820151816002015560608201518160030160006101000a8154816001600160a01b0302191690836001600160a01b03160217905550608082015181600401559050508260086000856000015181526020019081526020016000206000820151816000015560208201518160010160006101000a8154816001600160a01b0302191690836001600160a01b0316021790555060408201518160020160006101000a8154816001600160a01b0302191690836001600160a01b03160217905550606082015181600301556080820151816004015560a0820151816005015560c0820151816006015560e08201518160070160006101000a8154816001600160a01b0302191690836001600160a01b031602179055506101008201518160080155610120820151816009015561014082015181600a0160006101000a81548160ff021916908360018111156131d2576131d2615158565b0217905550610160820151600a8201805461ff0019166101008360018111156131fd576131fd615158565b0217905550905050612f9c3083602001518386612a5e565b600061128a8383613e32565b61322d85858385613e5c565b808560c00181815161323f9190615536565b90525084516000908152600860208181526040928390208851815590880151600180830180546001600160a01b03199081166001600160a01b0394851617909155948a0151600284018054871691841691909117905560608a0151600384015560808a0151600484015560a08a0151600584015560c08a0151600684015560e08a0151600784018054909616921691909117909355610100880151918101919091556101208701516009820155610140870151600a82018054899460ff1990911690838181111561331257613312615158565b0217905550610160820151600a8201805461ff00191661010083600181111561333d5761333d615158565b0217905550905050613356848660200151858589613c2f565b6133668560200151858388612a5e565b602080860151604080880151885182516001600160a01b038a81168252958101879052928301879052928416931691907f306e6cde5eb293794d557a3a6c844de939e6206b05e6910451c512852bf654a5906060015b60405180910390a45050505050565b606061128a83836040518060600160405280602781526020016155e7602791396140bc565b81516000908152600a60209081526040808320815160a0810183528154815260018201546001600160a01b039081169482019490945260028201549281018390526003820154909316606084015260040154608083018190529192916134569190615390565b905060008360400151846080015161346e9190615390565b905061348f8560c001518661010001516134889190615390565b83836141a7565b6134db5760405162461bcd60e51b815260206004820152601d60248201527f4d61726b6574706c6163653a206e6f742077696e6e696e67206269642e0000006044820152606401610a31565b600085610120015111801561350457508460c001518561012001516135009190615390565b8110155b1561351857613513858561300f565b6137b9565b84516000908152600a602090815260409182902086518155908601516001820180546001600160a01b03199081166001600160a01b03938416179091559287015160028301556060870151600383018054909416911617909155608085015160049091015560075460a0860151690100000000000000000090910467ffffffffffffffff16906135a9904290615536565b116136e15760075460a086018051690100000000000000000090920467ffffffffffffffff16916135db9083906152af565b90525084516000908152600860208181526040928390208851815590880151600180830180546001600160a01b03199081166001600160a01b0394851617909155948a0151600284018054871691841691909117905560608a0151600384015560808a0151600484015560a08a0151600584015560c08a0151600684015560e08a0151600784018054909616921691909117909355610100880151918101919091556101208701516009820155610140870151600a82018054899460ff199091169083818111156136ae576136ae615158565b0217905550610160820151600a8201805461ff0019166101008360018111156136d9576136d9615158565b021790555050505b60208301516001600160a01b0316158015906136fd5750600082115b15613716576137168560e0015130856020015185614204565b61372a8560e0015185602001513084614204565b846101600151600181111561374157613741615158565b84602001516001600160a01b031686600001517f8a412352601a288b3de40254a9de2ab14a497aa3638a7e558480680a56e2705d87604001518860400151896080015161378e9190615390565b6060808b01516040805194855260208501939093526001600160a01b031691830191909152016133bc565b5050505050565b8160c001518160400151111580156137dc575060008260c00151115b61384e5760405162461bcd60e51b815260206004820152602c60248201527f4d61726b6574706c6163653a20696e73756666696369656e7420746f6b656e7360448201527f20696e206c697374696e672e00000000000000000000000000000000000000006064820152608401610a31565b613874816020015182606001518360400151846080015161386f9190615390565b6143e2565b8151600090815260096020908152604080832082850180516001600160a01b0390811686529190935292819020845181559151600180840180549286166001600160a01b03199384161790559185015160028401556060850151600384018054919095169116179092556080830151600490910155610160830151908111156138ff576138ff615158565b81602001516001600160a01b031683600001517f8a412352601a288b3de40254a9de2ab14a497aa3638a7e558480680a56e2705d84604001518560400151866080015161394c9190615390565b6060878101516040805194855260208501939093526001600160a01b0316838301529051918290030190a45050565b6000610984825490565b60008181526001830160205260408120546139cc57508154600181810184556000848152602080822090930184905584548482528286019093526040902091909155610984565b506000610984565b606060006139e3836002615390565b6139ee9060026152af565b67ffffffffffffffff811115613a0657613a06614c05565b6040519080825280601f01601f191660200182016040528015613a30576020820181803683370190505b509050600360fc1b81600081518110613a4b57613a4b6153e5565b60200101906001600160f81b031916908160001a905350600f60fb1b81600181518110613a7a57613a7a6153e5565b60200101906001600160f81b031916908160001a9053506000613a9e846002615390565b613aa99060016152af565b90505b6001811115613b2e577f303132333435363738396162636465660000000000000000000000000000000085600f1660108110613aea57613aea6153e5565b1a60f81b828281518110613b0057613b006153e5565b60200101906001600160f81b031916908160001a90535060049490941c93613b278161554d565b9050613aac565b50831561128a5760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610a31565b6000828152602081815260408083206001600160a01b038516845290915290205460ff1615610f4c576000828152602081815260408083206001600160a01b03851684529091529020805460ff19169055613bd6612510565b6001600160a01b0316816001600160a01b0316837ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b60405160405180910390a45050565b600061128a836001600160a01b03841661455e565b60075460009061271090613c5290610100900467ffffffffffffffff1685615390565b613c5c9190615564565b6004805460405163f2aab4b360e01b81523092810192909252919250613ce991869189916001600160a01b03169063f2aab4b39060240160206040518083038186803b158015613cab57600080fd5b505afa158015613cbf573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190613ce39190615498565b84614204565b6000613cf58285615536565b6040808501516060860151915163152a902d60e11b81529293506001600160a01b031691632a55205a91613d36918890600401918252602082015260400190565b604080518083038186803b158015613d4d57600080fd5b505afa925050508015613d7d575060408051601f3d908101601f19168201909252613d7a91810190615586565b60015b613d8657613e26565b8015613e235785613d9785836152af565b1115613e0b5760405162461bcd60e51b815260206004820152603060248201527f4d61726b6574706c6163653a20546f74616c206d61726b65742066656573206560448201527f7863656564207468652070726963652e000000000000000000000000000000006064820152608401610a31565b613e158184615536565b9250613e23878a8484614204565b50505b612a5585888884614204565b6000826000018281548110613e4957613e496153e5565b9060005260206000200154905092915050565b60008461016001516001811115613e7557613e75615158565b14613ee85760405162461bcd60e51b815260206004820152602560248201527f4d61726b6574706c6163653a2063616e6e6f74206275792066726f6d206c697360448201527f74696e672e0000000000000000000000000000000000000000000000000000006064820152608401610a31565b60008460c00151118015613efc5750600082115b8015613f0c57508360c001518211155b613f7e5760405162461bcd60e51b815260206004820152602d60248201527f4d61726b6574706c6163653a20627579696e6720696e76616c696420616d6f7560448201527f6e74206f6620746f6b656e732e000000000000000000000000000000000000006064820152608401610a31565b8360a0015142108015613f945750836080015142115b613fec5760405162461bcd60e51b8152602060048201526024808201527f4d61726b6574706c6163653a206e6f742077697468696e2073616c652077696e6044820152633237bb9760e11b6064820152608401610a31565b60e08401516001600160a01b031673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee141561408f5780341461408a5760405162461bcd60e51b815260206004820152603860248201527f4d61726b6574706c6163653a20696e73756666696369656e742063757272656e60448201527f63792062616c616e6365206f7220616c6c6f77616e63652e00000000000000006064820152608401610a31565b61409e565b61409e838560e00151836143e2565b612baa846020015185604001518660600151858861014001516126fb565b6060833b6141325760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e747261637400000000000000000000000000000000000000000000000000006064820152608401610a31565b600080856001600160a01b03168560405161414d91906155b4565b600060405180830381855af49150503d8060008114614188576040519150601f19603f3d011682016040523d82523d6000602084013e61418d565b606091505b509150915061419d828286614651565b9695505050505050565b600082156141f75782821180156141f25750600754600160881b900467ffffffffffffffff16836127106141db8286615536565b6141e59190615390565b6141ef9190615564565b10155b6141fc565b838210155b949350505050565b8061420e57612baa565b6001600160a01b03841673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee14156143d6576001600160a01b0383163014156142cd57604051632e1a7d4d60e01b8152600481018290527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031690632e1a7d4d90602401600060405180830381600087803b1580156142a657600080fd5b505af11580156142ba573d6000803e3d6000fd5b505050506142c8828261468a565b612baa565b6001600160a01b0382163014156143cc573481146143535760405162461bcd60e51b815260206004820152603a60248201527f4d61726b6574706c6163653a206e617469766520746f6b656e2076616c75652060448201527f646f6573206e6f74206d617463682062696420616d6f756e742e0000000000006064820152608401610a31565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663d0e30db0826040518263ffffffff1660e01b81526004016000604051808303818588803b1580156143ae57600080fd5b505af11580156143c2573d6000803e3d6000fd5b5050505050612baa565b6142c8828261468a565b612baa84848484614781565b6040516370a0823160e01b81526001600160a01b0384811660048301528291908416906370a082319060240160206040518083038186803b15801561442657600080fd5b505afa15801561443a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061445e91906153af565b101580156144ec5750604051636eb1769f60e11b81526001600160a01b03848116600483015230602483015282919084169063dd62ed3e9060440160206040518083038186803b1580156144b157600080fd5b505afa1580156144c5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906144e991906153af565b10155b610e0e5760405162461bcd60e51b815260206004820152603860248201527f4d61726b6574706c6163653a20696e73756666696369656e742063757272656e60448201527f63792062616c616e6365206f7220616c6c6f77616e63652e00000000000000006064820152608401610a31565b60008181526001830160205260408120548015614647576000614582600183615536565b855490915060009061459690600190615536565b90508181146145fb5760008660000182815481106145b6576145b66153e5565b90600052602060002001549050808760000184815481106145d9576145d96153e5565b6000918252602080832090910192909255918252600188019052604090208390555b855486908061460c5761460c6155d0565b600190038181906000526020600020016000905590558560010160008681526020019081526020016000206000905560019350505050610984565b6000915050610984565b6060831561466057508161128a565b8251156146705782518084602001fd5b8160405162461bcd60e51b8152600401610a31919061521d565b6000826001600160a01b03168260405160006040518083038185875af1925050503d80600081146146d7576040519150601f19603f3d011682016040523d82523d6000602084013e6146dc565b606091505b5050905080610e0e577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663d0e30db0836040518263ffffffff1660e01b81526004016000604051808303818588803b15801561474057600080fd5b505af1158015614754573d6000803e3d6000fd5b5050505050610e0e7f00000000000000000000000000000000000000000000000000000000000000003085855b816001600160a01b0316836001600160a01b031614156147a057612baa565b6040516370a0823160e01b81526001600160a01b038381166004830152600091908616906370a082319060240160206040518083038186803b1580156147e557600080fd5b505afa1580156147f9573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061481d91906153af565b905060006001600160a01b03851630146148c0576040516323b872dd60e01b81526001600160a01b0386811660048301528581166024830152604482018590528716906323b872dd90606401602060405180830381600087803b15801561488357600080fd5b505af1158015614897573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906148bb91906153c8565b614942565b60405163a9059cbb60e01b81526001600160a01b0385811660048301526024820185905287169063a9059cbb90604401602060405180830381600087803b15801561490a57600080fd5b505af115801561491e573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061494291906153c8565b6040516370a0823160e01b81526001600160a01b0386811660048301529192506000918816906370a082319060240160206040518083038186803b15801561498957600080fd5b505afa15801561499d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906149c191906153af565b90508180156149d857506149d584846152af565b81145b612a555760405162461bcd60e51b815260206004820152602960248201527f4d61726b6574706c6163653a206661696c656420746f207472616e736665722060448201527f63757272656e63792e00000000000000000000000000000000000000000000006064820152608401610a31565b828054614a569061545d565b90600052602060002090601f016020900481019282614a785760008555614abe565b82601f10614a915782800160ff19823516178555614abe565b82800160010185558215614abe579182015b82811115614abe578235825591602001919060010190614aa3565b50614aca929150614ace565b5090565b5b80821115614aca5760008155600101614acf565b600060208284031215614af557600080fd5b81356001600160e01b03198116811461128a57600080fd5b6001600160a01b0381168114614b2257600080fd5b50565b80356126bf81614b0d565b60008083601f840112614b4257600080fd5b50813567ffffffffffffffff811115614b5a57600080fd5b602083019150836020828501011115614b7257600080fd5b9250929050565b600080600080600060808688031215614b9157600080fd5b8535614b9c81614b0d565b94506020860135614bac81614b0d565b935060408601359250606086013567ffffffffffffffff811115614bcf57600080fd5b614bdb88828901614b30565b969995985093965092949392505050565b600060208284031215614bfe57600080fd5b5035919050565b634e487b7160e01b600052604160045260246000fd5b604051610120810167ffffffffffffffff81118282101715614c3f57614c3f614c05565b60405290565b604051601f8201601f1916810167ffffffffffffffff81118282101715614c6e57614c6e614c05565b604052919050565b8035600281106126bf57600080fd5b60006101208284031215614c9857600080fd5b614ca0614c1b565b614ca983614b25565b815260208301356020820152604083013560408201526060830135606082015260808301356080820152614cdf60a08401614b25565b60a082015260c083013560c082015260e083013560e0820152610100614d06818501614c76565b908201529392505050565b60008060408385031215614d2457600080fd5b823591506020830135614d3681614b0d565b809150509250929050565b8015158114614b2257600080fd5b600060208284031215614d6157600080fd5b813561128a81614d41565b600060208284031215614d7e57600080fd5b813561128a81614b0d565b60008060408385031215614d9c57600080fd5b50508035926020909101359150565b60008060208385031215614dbe57600080fd5b823567ffffffffffffffff811115614dd557600080fd5b614de185828601614b30565b90969095509350505050565b60008060208385031215614e0057600080fd5b823567ffffffffffffffff80821115614e1857600080fd5b818501915085601f830112614e2c57600080fd5b813581811115614e3b57600080fd5b8660208260051b8501011115614e5057600080fd5b60209290920196919550909350505050565b60005b83811015614e7d578181015183820152602001614e65565b83811115612baa5750506000910152565b60008151808452614ea6816020860160208601614e62565b601f01601f19169290920160200192915050565b6000602080830181845280855180835260408601915060408160051b870101925083870160005b82811015614f0f57603f19888603018452614efd858351614e8e565b94509285019290850190600101614ee1565b5092979650505050505050565b60008060008060808587031215614f3257600080fd5b84359350602085013592506040850135614f4b81614b0d565b9396929550929360600135925050565b600082601f830112614f6c57600080fd5b8135602067ffffffffffffffff821115614f8857614f88614c05565b8160051b614f97828201614c45565b9283528481018201928281019087851115614fb157600080fd5b83870192505b84831015614fd057823582529183019190830190614fb7565b979650505050505050565b600082601f830112614fec57600080fd5b813567ffffffffffffffff81111561500657615006614c05565b615019601f8201601f1916602001614c45565b81815284602083860101111561502e57600080fd5b816020850160208301376000918101602001919091529392505050565b600080600080600060a0868803121561506357600080fd5b853561506e81614b0d565b9450602086013561507e81614b0d565b9350604086013567ffffffffffffffff8082111561509b57600080fd5b6150a789838a01614f5b565b945060608801359150808211156150bd57600080fd5b6150c989838a01614f5b565b935060808801359150808211156150df57600080fd5b506150ec88828901614fdb565b9150509295509295909350565b600080600080600080600060e0888a03121561511457600080fd5b87359650602088013595506040880135945060608801359350608088013561513b81614b0d565b9699959850939692959460a0840135945060c09093013592915050565b634e487b7160e01b600052602160045260246000fd5b60028110614b2257634e487b7160e01b600052602160045260246000fd5b6151958161516e565b9052565b6000610180820190508d82526001600160a01b03808e166020840152808d1660408401528b60608401528a60808401528960a08401528860c084015280881660e08401525085610100830152846101208301526151f58461516e565b836101408301526152058361516e565b826101608301529d9c50505050505050505050505050565b60208152600061128a6020830184614e8e565b600080600080600060a0868803121561524857600080fd5b853561525381614b0d565b9450602086013561526381614b0d565b93506040860135925060608601359150608086013567ffffffffffffffff81111561528d57600080fd5b6150ec88828901614fdb565b634e487b7160e01b600052601160045260246000fd5b600082198211156152c2576152c2615299565b500190565b815181526020808301516101808301916152eb908401826001600160a01b03169052565b50604083015161530660408401826001600160a01b03169052565b50606083015160608301526080830151608083015260a083015160a083015260c083015160c083015260e083015161534960e08401826001600160a01b03169052565b5061010083810151908301526101208084015190830152610140808401516153738285018261518c565b5050610160808401516153888285018261518c565b505092915050565b60008160001904831182151516156153aa576153aa615299565b500290565b6000602082840312156153c157600080fd5b5051919050565b6000602082840312156153da57600080fd5b815161128a81614d41565b634e487b7160e01b600052603260045260246000fd5b6000808335601e1984360301811261541257600080fd5b83018035915067ffffffffffffffff82111561542d57600080fd5b602001915036819003821315614b7257600080fd5b600060001982141561545657615456615299565b5060010190565b600181811c9082168061547157607f821691505b6020821081141561549257634e487b7160e01b600052602260045260246000fd5b50919050565b6000602082840312156154aa57600080fd5b815161128a81614b0d565b7f416363657373436f6e74726f6c3a206163636f756e74200000000000000000008152600083516154ed816017850160208801614e62565b7f206973206d697373696e6720726f6c6520000000000000000000000000000000601791840191820152835161552a816028840160208801614e62565b01602801949350505050565b60008282101561554857615548615299565b500390565b60008161555c5761555c615299565b506000190190565b60008261558157634e487b7160e01b600052601260045260246000fd5b500490565b6000806040838503121561559957600080fd5b82516155a481614b0d565b6020939093015192949293505050565b600082516155c6818460208701614e62565b9190910192915050565b634e487b7160e01b600052603160045260246000fdfe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a164736f6c6343000809000a";
}
