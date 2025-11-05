const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("BlackCrowCreativeLabNFTContract", function () {
  let BlackCrowCreativeLabNFTContractFactory;
  let BlackCrowCreativeLabNFTContract;

  const args = {
    mint_price: 20000000000000000n, // 0.02 ETH
    max_tokens: 3n,
    base_uri:
      "https://ipfs.io/ipfs/bafkreidr5a7hvyiilxfug2yqpbkdowcahpbsw4jszstz6iur5ae5dx7b54",
    royaltyArtist: "0x94848CEe6eA7dBcc5322f0B13015A42ec63bC3BB",
    royaltyBasis: 500n, // 5%
  };

  beforeEach(async function () {
    BlackCrowCreativeLabNFTContractFactory = await ethers.getContractFactory(
      "BlackCrowCreativeLabNFTContract"
    );
    BlackCrowCreativeLabNFTContract = await BlackCrowCreativeLabNFTContractFactory.deploy(
      args.mint_price,
      args.max_tokens,
      args.base_uri,
      args.royaltyArtist,
      args.royaltyBasis
    );
    await BlackCrowCreativeLabNFTContract.waitForDeployment();
  });

  // -------------------------------------------------------------------------
  // Construction & Initialization
  // -------------------------------------------------------------------------
  describe("construction and initialization", function () {
    it("should be named BlackCrowCreativeLabNFTContract", async function () {
      const expectedValue = "BlackCrowCreativeLabNFTContract";
      const currentValue = await BlackCrowCreativeLabNFTContract.name();
      assert.equal(currentValue.toString(), expectedValue);
    });

    it("should have symbol BCCL", async function () {
      const expectedValue = "BCCL";
      const currentValue = await BlackCrowCreativeLabNFTContract.symbol();
      assert.equal(currentValue.toString(), expectedValue);
    });

    it("should have a mint price set when constructed", async function () {
      const expectedValue = args.mint_price;
      const currentValue = await BlackCrowCreativeLabNFTContract.getMintPrice();
      assert.equal(currentValue.toString(), expectedValue.toString());
    });

    it("should have a max token supply set when constructed", async function () {
      const expectedValue = args.max_tokens;
      const currentValue = await BlackCrowCreativeLabNFTContract.getMaxSupply();
      assert.equal(currentValue.toString(), expectedValue.toString());
    });

    it("should have a base URI set when constructed", async function () {
      const expectedValue = args.base_uri;
      const currentValue = await BlackCrowCreativeLabNFTContract.getBaseURI();
      assert.equal(currentValue.toString(), expectedValue);
    });

    it("should set royalty artist when constructed", async function () {
      const expectedValue = args.royaltyArtist;
      const currentValue = await BlackCrowCreativeLabNFTContract.royaltyInfo(
        1,
        ethers.parseUnits("0.02", "ether")
      );
      assert.equal(currentValue[0].toString(), expectedValue);
    });

    it("should set royalty share when constructed", async function () {
      const expectedValue =
        (args.royaltyBasis * args.mint_price) / 10000n; // all BigInts
      const currentValue = await BlackCrowCreativeLabNFTContract.royaltyInfo(
        1,
        ethers.parseUnits("0.02", "ether")
      );
      assert.equal(currentValue[1].toString(), expectedValue.toString());
    });

    it("should set owner to the deployer's address", async function () {
      const [owner] = await ethers.getSigners();
      const expectedValue = owner.address;
      const currentValue = await BlackCrowCreativeLabNFTContract.owner();
      assert.equal(currentValue.toString(), expectedValue);
    });
  });

  // -------------------------------------------------------------------------
  // Receive Function
  // -------------------------------------------------------------------------
  describe("receive function", function () {
    it("should revert if called from low-level transaction", async function () {
      const contractAddress = await BlackCrowCreativeLabNFTContract.getAddress();
      const [_, __, buyer] = await ethers.getSigners();
      await expect(
        buyer.sendTransaction({
          to: contractAddress,
          value: ethers.parseUnits("2.0", "ether"),
        })
      ).to.be.reverted;
    });
  });

  // -------------------------------------------------------------------------
  // Fallback Function
  // -------------------------------------------------------------------------
  describe("fallback function", function () {
    it("should revert if called with no data", async function () {
      const contractAddress = await BlackCrowCreativeLabNFTContract.getAddress();
      const [_, __, buyer] = await ethers.getSigners();
      await expect(buyer.sendTransaction({ to: contractAddress })).to.be.reverted;
    });
  });

  // -------------------------------------------------------------------------
  // Mint Function
  // -------------------------------------------------------------------------
  describe("mintTo function", function () {
    it("should revert if called with no ether", async function () {
      const [_, __, buyer] = await ethers.getSigners();
      await expect(
        BlackCrowCreativeLabNFTContract.connect(buyer).mintTo(args.base_uri, {
          value: 0n,
        })
      ).to.be.reverted;
    });

    it("should revert if called with too little ether", async function () {
      const [_, __, buyer] = await ethers.getSigners();
      await expect(
        BlackCrowCreativeLabNFTContract.connect(buyer).mintTo(args.base_uri, {
          value: args.mint_price - 1n,
        })
      ).to.be.reverted;
    });

    it("should revert if called with too much ether", async function () {
      const [_, __, buyer] = await ethers.getSigners();
      await expect(
        BlackCrowCreativeLabNFTContract.connect(buyer).mintTo(args.base_uri, {
          value: args.mint_price + 1n,
        })
      ).to.be.reverted;
    });

    it("should not revert if called with correct ether", async function () {
      const [_, __, buyer] = await ethers.getSigners();
      await expect(
        BlackCrowCreativeLabNFTContract.connect(buyer).mintTo(args.base_uri, {
          value: args.mint_price,
        })
      ).to.not.be.reverted;
    });

    it("should revert if called after all tokens are minted", async function () {
      const [_, __, buyer] = await ethers.getSigners();
      for (let i = 0n; i < args.max_tokens; i++) {
        await BlackCrowCreativeLabNFTContract.connect(buyer).mintTo(args.base_uri, {
          value: args.mint_price,
        });
      }
      await expect(
        BlackCrowCreativeLabNFTContract.connect(buyer).mintTo(args.base_uri, {
          value: args.mint_price,
        })
      ).to.be.reverted;
    });

    it("should increase totalSupply after mint", async function () {
      const [_, __, buyer] = await ethers.getSigners();
      await BlackCrowCreativeLabNFTContract.connect(buyer).mintTo(args.base_uri, {
        value: args.mint_price,
      });
      const total = await BlackCrowCreativeLabNFTContract.totalSupply();
      assert.equal(total.toString(), "1");
    });
  });

  // -------------------------------------------------------------------------
  // Getter Functions
  // -------------------------------------------------------------------------
  describe("getter functions", function () {
    it("getMaxSupply() should return the max tokens", async function () {
      const expectedValue = args.max_tokens;
      const currentValue = await BlackCrowCreativeLabNFTContract.getMaxSupply();
      assert.equal(currentValue.toString(), expectedValue.toString());
    });

    it("getMintPrice() should return the mint price", async function () {
      const expectedValue = args.mint_price;
      const currentValue = await BlackCrowCreativeLabNFTContract.getMintPrice();
      assert.equal(currentValue.toString(), expectedValue.toString());
    });

    it("getBaseURI() should return the base URI", async function () {
      const expectedValue = args.base_uri;
      const currentValue = await BlackCrowCreativeLabNFTContract.getBaseURI();
      assert.equal(currentValue.toString(), expectedValue);
    });
  });
});
