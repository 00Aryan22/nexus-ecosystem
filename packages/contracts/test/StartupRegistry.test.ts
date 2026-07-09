import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("StartupRegistry", function () {
  let admin: HardhatEthersSigner;
  let founder1: HardhatEthersSigner;
  let founder2: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, founder1, founder2] = await ethers.getSigners();
  });

  async function deploy() {
    const Factory = await ethers.getContractFactory("StartupRegistry");
    const reg = await Factory.deploy(admin.address);
    await reg.waitForDeployment();
    return reg;
  }

  it("deploys with admin role", async function () {
    const reg = await deploy();
    const ADMIN_ROLE = await reg.ADMIN_ROLE();
    expect(await reg.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
  });

  it("registers a startup", async function () {
    const reg = await deploy();
    const tx = await reg.connect(founder1).registerStartup("Nexus AI", "AI", "ipfs://meta1");
    await expect(tx).to.emit(reg, "StartupRegistered").withArgs(1n, founder1.address, "Nexus AI", "AI");

    const startup = await reg.getStartup(1n);
    expect(startup.founder).to.equal(founder1.address);
    expect(startup.name).to.equal("Nexus AI");
    expect(startup.industry).to.equal("AI");
    expect(startup.exists).to.be.true;
  });

  it("rejects duplicate name", async function () {
    const reg = await deploy();
    await reg.connect(founder1).registerStartup("Nexus AI", "AI", "ipfs://meta1");
    await expect(reg.connect(founder2).registerStartup("Nexus AI", "Blockchain", "ipfs://meta2"))
      .to.be.revertedWith("StartupRegistry: name already reserved");
  });

  it("lists founder projects", async function () {
    const reg = await deploy();
    await reg.connect(founder1).registerStartup("Project A", "AI", "ipfs://a");
    await reg.connect(founder1).registerStartup("Project B", "Blockchain", "ipfs://b");
    await reg.connect(founder2).registerStartup("Project C", "DeFi", "ipfs://c");

    const projects1 = await reg.listFounderProjects(founder1.address);
    expect(projects1.length).to.equal(2);
    expect(projects1[0]).to.equal(1n);
    expect(projects1[1]).to.equal(2n);

    const projects2 = await reg.listFounderProjects(founder2.address);
    expect(projects2.length).to.equal(1);
    expect(projects2[0]).to.equal(3n);
  });

  it("updates startup", async function () {
    const reg = await deploy();
    await reg.connect(founder1).registerStartup("Old Name", "AI", "ipfs://old");
    await reg.connect(founder1).updateStartup(1n, "New Name", "ipfs://new");

    const startup = await reg.getStartup(1n);
    expect(startup.name).to.equal("New Name");
    expect(startup.metadataUri).to.equal("ipfs://new");
  });

  it("rejects update from non-founder", async function () {
    const reg = await deploy();
    await reg.connect(founder1).registerStartup("My Startup", "AI", "ipfs://meta");
    await expect(reg.connect(founder2).updateStartup(1n, "Hacked Name", "ipfs://hack"))
      .to.be.revertedWith("StartupRegistry: not the founder");
  });

  it("returns correct startup count", async function () {
    const reg = await deploy();
    expect(await reg.getStartupCount()).to.equal(0n);
    await reg.connect(founder1).registerStartup("A", "AI", "ipfs://a");
    await reg.connect(founder2).registerStartup("B", "DeFi", "ipfs://b");
    expect(await reg.getStartupCount()).to.equal(2n);
  });
});
