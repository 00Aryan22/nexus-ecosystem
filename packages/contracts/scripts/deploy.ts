import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy SkillPassportNFT
  const PassportFactory = await ethers.getContractFactory("SkillPassportNFT");
  const passport = await PassportFactory.deploy(deployer.address);
  await passport.waitForDeployment();
  console.log("SkillPassportNFT deployed to:", await passport.getAddress());

  // Deploy StartupRegistry
  const RegistryFactory = await ethers.getContractFactory("StartupRegistry");
  const registry = await RegistryFactory.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log("StartupRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
