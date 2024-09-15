import {
  time,
  loadFixture,
  impersonateAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const C_USDC_V3_ADDRESS = "0xc3d688B66703497DAA19211EEdff47f25384cdc3";
const IMPERSONATED_WHALE_ADDRESS = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";

describe("ERC4626CompoundV3UsdcVault Tests", () => {
  const deployedContracts = async () => {
    const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);

    const ERC4626CompoundV3UsdcVault = await ethers.getContractFactory(
      "ERC4626CompoundV3UsdcVault"
    );

    const compoundV3UsdcVault = await upgrades.deployProxy(
      ERC4626CompoundV3UsdcVault,
      [USDC_ADDRESS, C_USDC_V3_ADDRESS],
      {
        initializer: "initialize",
      }
    );

    await compoundV3UsdcVault.waitForDeployment();

    await impersonateAccount(IMPERSONATED_WHALE_ADDRESS);

    const impersonatedWhaleAccount = await ethers.getSigner(
      IMPERSONATED_WHALE_ADDRESS
    );

    return {
      usdc,
      compoundV3UsdcVault,
      impersonatedWhaleAccount,
    };
  };

  it("should successfully deploy ERC4626CompoundV3UsdcVault with correct configuration", async () => {
    const { compoundV3UsdcVault } = await loadFixture(deployedContracts);

    const usdcAddress = await compoundV3UsdcVault.usdc();
    const cUSDCv3Address = await compoundV3UsdcVault.cUSDCv3();

    expect(usdcAddress).to.equal(USDC_ADDRESS);
    expect(cUSDCv3Address).to.equal(C_USDC_V3_ADDRESS);
  });

  it("should successfully deposit USDC to the ERC4626CompoundV3UsdcVault contract", async () => {
    const { usdc, compoundV3UsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(compoundV3UsdcVault.getAddress(), ethers.MaxUint256);

    await compoundV3UsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await compoundV3UsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");
  });

  it("should successfully withdraw USDC from the ERC4626CompoundV3UsdcVault contract", async () => {
    const { usdc, compoundV3UsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(compoundV3UsdcVault.getAddress(), ethers.MaxUint256);

    await compoundV3UsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await compoundV3UsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(43200);

    const amountToWithdraw = await compoundV3UsdcVault.totalAssets();

    await compoundV3UsdcVault
      .connect(impersonatedWhaleAccount)
      .withdraw(
        amountToWithdraw,
        impersonatedWhaleAccount.getAddress(),
        impersonatedWhaleAccount.getAddress()
      );
  });

  it("should successfully rescue funds from the ERC4626CompoundV3UsdcVault contract", async () => {
    const { usdc, compoundV3UsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    const accounts = await ethers.getSigners();

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(compoundV3UsdcVault.getAddress(), ethers.MaxUint256);

    await compoundV3UsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await compoundV3UsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(43200);

    await compoundV3UsdcVault
      .connect(accounts[0])
      .rescueFunds(accounts[0].getAddress());
  });
}).timeout(72000);
