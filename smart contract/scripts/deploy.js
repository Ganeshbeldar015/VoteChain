import hre from "hardhat";

async function main() {
  const VoteChain = await hre.ethers.getContractFactory("VoteChain");
  const voteChain = await VoteChain.deploy();

  await voteChain.waitForDeployment();

  console.log(
    `VoteChain with deployed to ${await voteChain.getAddress()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
