const { ethers, run, network } = require("hardhat");
require("dotenv").config();

async function main() {
  const args = {
    mint_price: "20000000000000000", // 0.02 MATIC
    max_tokens: 3,
    base_uri: "https://ipfs.io/ipfs/QmTwiGMeNjhrECN5tHkSEN7jHDEQ3tvFzeCXF4f3EhZJzv",
    royaltyArtist: process.env.STUNT_WALLET_ADDRESS,
    royaltyBasis: 500,
  };

  console.log("Deploying BlackCrowCreativeLabNFTContract...");
  const Factory = await ethers.getContractFactory("BlackCrowCreativeLabNFTContract");
  const Contract = await Factory.deploy(
    args.mint_price,
    args.max_tokens,
    args.base_uri,
    args.royaltyArtist,
    args.royaltyBasis
  );

  await Contract.waitForDeployment();
  const contractAddress = await Contract.getAddress();
  console.log(`Deployed to: ${contractAddress}`);

  console.log("Waiting for one block confirmation...");
  await Contract.deploymentTransaction().wait(1);

  if (
    (network.config.chainId === 80001 && process.env.POLYGONSCAN_API_KEY) ||
    (network.config.chainId === 80002 && process.env.POLYGONSCAN_API_KEY) ||
    (network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY)
  ) {
    console.log("Verifying contract...");
    await verify(contractAddress, [
      args.mint_price,
      args.max_tokens,
      args.base_uri,
      args.royaltyArtist,
      args.royaltyBasis,
    ]);
  } else {
    console.log("Skipping verification on local network.");
  }

  const ipfs = [
    "https://ipfs.io/ipfs/QmdKR2UxXcSLVptr6ggziRG4EKUYNSiS2AFEy3wUAHVqUt",
    "https://ipfs.io/ipfs/QmQnABgoMhgP1t1gyopTS4EmsaPUZ6dwufpq1QWBZg4RyD",
    "https://ipfs.io/ipfs/QmfKLqTkMSNiC3Kc7unLctWkJREWFv4gF8Cknhkdej3snb",
  ];

  console.log("Minting three tokens...");
  for (let i = 0; i < 3; i++) {
    const tx = await Contract.mintTo(ipfs[i], { value: args.mint_price });
    console.log(`Mint transaction ${i + 1}: ${tx.hash}`);
    await tx.wait(1);
    console.log(`Token ${i + 1} minted.`);
  }

  console.log("All tokens minted. Deployment and minting complete.");
}

async function verify(contractAddress, args) {
  console.log("Verifying contract on Polygonscan...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    console.log("Verification successful.");
  } catch (err) {
    if (err.message.toLowerCase().includes("already verified")) {
      console.log("Already verified on Polygonscan.");
    } else {
      console.error("Verification error:", err);
    }
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exitCode = 1;
});
