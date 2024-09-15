import {
  time,
  loadFixture,
  impersonateAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const USDC_ADDRESS = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
const BENQI_USDCN_ADDRESS = "0xB715808a78F6041E46d61Cb123C9B4A27056AE9C";
const IMPERSONATED_WHALE_ADDRESS = "0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9";

describe("ERC4626BenqiUsdcVault Tests", () => {
  const deployedContracts = async () => {
    const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);

    const ERC4626BenqiUsdcVault = await ethers.getContractFactory(
      "ERC4626BenqiUsdcVault"
    );

    const benqiUsdcVault = await upgrades.deployProxy(
      ERC4626BenqiUsdcVault,
      [USDC_ADDRESS, BENQI_USDCN_ADDRESS],
      {
        initializer: "initialize",
      }
    );

    await benqiUsdcVault.waitForDeployment();

    await impersonateAccount(IMPERSONATED_WHALE_ADDRESS);

    const impersonatedWhaleAccount = await ethers.getSigner(
      IMPERSONATED_WHALE_ADDRESS
    );

    return {
      usdc,
      benqiUsdcVault,
      impersonatedWhaleAccount,
    };
  };

  it("should successfully deploy ERC4626BenqiUsdcVault with correct configuration", async () => {
    const { benqiUsdcVault } = await loadFixture(deployedContracts);

    const usdcAddress = await benqiUsdcVault.usdc();
    const qiUSDCnAddress = await benqiUsdcVault.qiUSDCn();

    expect(usdcAddress).to.equal(USDC_ADDRESS);
    expect(qiUSDCnAddress).to.equal(BENQI_USDCN_ADDRESS);
  });

  it("should successfully deposit USDC to the ERC4626BenqiUsdcVault contract", async () => {
    const { usdc, benqiUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(benqiUsdcVault.getAddress(), ethers.MaxUint256);

    await benqiUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await benqiUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");
  });

  it("should successfully withdraw USDC from the ERC4626BenqiUsdcVault contract", async () => {
    const { usdc, benqiUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(benqiUsdcVault.getAddress(), ethers.MaxUint256);

    await benqiUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await benqiUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(43200);

    const amountToWithdraw = await benqiUsdcVault.totalAssets();

    await benqiUsdcVault
      .connect(impersonatedWhaleAccount)
      .withdraw(
        amountToWithdraw,
        impersonatedWhaleAccount.getAddress(),
        impersonatedWhaleAccount.getAddress()
      );
  });

  it("should successfully rescue funds from the ERC4626BenqiUsdcVault contract", async () => {
    const { usdc, benqiUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    const accounts = await ethers.getSigners();

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(benqiUsdcVault.getAddress(), ethers.MaxUint256);

    await benqiUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await benqiUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(43200);

    await benqiUsdcVault
      .connect(accounts[0])
      .rescueFunds(accounts[0].getAddress());
  });
}).timeout(72000);
