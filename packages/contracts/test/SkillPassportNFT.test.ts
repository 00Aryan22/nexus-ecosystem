import { expect } from "chai";
import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SkillPassportNFT", function () {
  let admin: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, issuer, user1, user2] = await ethers.getSigners();
  });

  async function deploy() {
    const Factory = await ethers.getContractFactory("SkillPassportNFT");
    const nft = await Factory.deploy(admin.address);
    await nft.waitForDeployment();
    return nft;
  }

  // ─── Deployment ───────────────────────────────────────────────────────────
  it("deploys with correct name and symbol", async function () {
    const nft = await deploy();
    expect(await nft.name()).to.equal("NexusSkillPassport");
    expect(await nft.symbol()).to.equal("NSP");
  });

  it("grants admin and issuer roles to deployer", async function () {
    const nft = await deploy();
    const ADMIN_ROLE  = await nft.ADMIN_ROLE();
    const ISSUER_ROLE = await nft.ISSUER_ROLE();
    expect(await nft.hasRole(ADMIN_ROLE,  admin.address)).to.be.true;
    expect(await nft.hasRole(ISSUER_ROLE, admin.address)).to.be.true;
  });

  // ─── Mint ─────────────────────────────────────────────────────────────────
  it("mints a passport for a wallet", async function () {
    const nft = await deploy();
    const uri = "ipfs://QmTestMetadata1";

    await expect(nft.connect(admin).mint(user1.address, uri))
      .to.emit(nft, "PassportMinted")
      .withArgs(1n, user1.address, uri);

    expect(await nft.ownerOf(1n)).to.equal(user1.address);
    expect(await nft.tokenURI(1n)).to.equal(uri);
    expect(await nft.tokenOfWallet(user1.address)).to.equal(1n);
    expect(await nft.walletOfToken(1n)).to.equal(user1.address);
  });

  it("reverts when minting a second passport to the same wallet", async function () {
    const nft = await deploy();
    await nft.connect(admin).mint(user1.address, "ipfs://first");
    await expect(nft.connect(admin).mint(user1.address, "ipfs://second"))
      .to.be.revertedWith("SkillPassportNFT: wallet already has a passport");
  });

  it("reverts mint with empty metadata URI", async function () {
    const nft = await deploy();
    await expect(nft.connect(admin).mint(user1.address, ""))
      .to.be.revertedWith("SkillPassportNFT: empty metadata URI");
  });

  it("reverts mint from non-issuer", async function () {
    const nft = await deploy();
    await expect(nft.connect(user1).mint(user2.address, "ipfs://x"))
      .to.be.reverted;
  });

  // ─── Soulbound ────────────────────────────────────────────────────────────
  it("blocks transfers between wallets (soulbound)", async function () {
    const nft = await deploy();
    await nft.connect(admin).mint(user1.address, "ipfs://soulbound");

    await expect(
      nft.connect(user1).transferFrom(user1.address, user2.address, 1n)
    ).to.be.revertedWith("SkillPassportNFT: soulbound - transfers disabled");
  });

  // ─── Update Metadata ──────────────────────────────────────────────────────
  it("updates token URI", async function () {
    const nft = await deploy();
    await nft.connect(admin).mint(user1.address, "ipfs://old");
    const newUri = "ipfs://new";

    await expect(nft.connect(admin).updateMetadata(1n, newUri))
      .to.emit(nft, "PassportUpdated")
      .withArgs(1n, newUri);

    expect(await nft.tokenURI(1n)).to.equal(newUri);
  });

  // ─── Revoke ───────────────────────────────────────────────────────────────
  it("admin can revoke a passport", async function () {
    const nft = await deploy();
    await nft.connect(admin).mint(user1.address, "ipfs://revoke");

    await expect(nft.connect(admin).revoke(1n))
      .to.emit(nft, "PassportRevoked")
      .withArgs(1n, user1.address);

    // wallet mapping should be cleared
    expect(await nft.tokenOfWallet(user1.address)).to.equal(0n);
  });

  it("non-admin cannot revoke", async function () {
    const nft = await deploy();
    await nft.connect(admin).mint(user1.address, "ipfs://revoke");
    await expect(nft.connect(user1).revoke(1n)).to.be.reverted;
  });
});
