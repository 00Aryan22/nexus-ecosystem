import { expect } from "chai";
import { ethers } from "hardhat";

describe("SkillPassportNFT", function () {
  it("deploys with correct name constant", async function () {
    const Factory = await ethers.getContractFactory("SkillPassportNFT");
    const nft = await Factory.deploy();
    await nft.waitForDeployment();
    expect(await nft.NAME()).to.equal("NexusSkillPassport");
  });
});
