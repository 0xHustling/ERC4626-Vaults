import {
  time,
  loadFixture,
  impersonateAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const AAVE_ETH_USDC_ADDRESS = "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c";
const AAVE_V3_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const IMPERSONATED_WHALE_ADDRESS = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";

describe("ERC4626AaveV3UsdcVault Tests", () => {
  const deployedContracts = async () => {
    const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);

    const ERC4626AaveV3UsdcVault = await ethers.getContractFactory(
      "ERC4626AaveV3UsdcVault"
    );

    const aaveV3UsdcVault = await upgrades.deployProxy(
      ERC4626AaveV3UsdcVault,
      [USDC_ADDRESS, AAVE_V3_ADDRESS, AAVE_ETH_USDC_ADDRESS],
      {
        initializer: "initialize",
      }
    );

    await aaveV3UsdcVault.waitForDeployment();

    await impersonateAccount(IMPERSONATED_WHALE_ADDRESS);

    const impersonatedWhaleAccount = await ethers.getSigner(
      IMPERSONATED_WHALE_ADDRESS
    );

    return {
      usdc,
      aaveV3UsdcVault,
      impersonatedWhaleAccount,
    };
  };

  it("should successfully deploy ERC4626AaveV3UsdcVault with correct configuration", async () => {
    const { aaveV3UsdcVault } = await loadFixture(deployedContracts);

    const usdcAddress = await aaveV3UsdcVault.usdc();
    const aEthUSDCAddress = await aaveV3UsdcVault.aEthUSDC();
    const aaveV3PoolAddress = await aaveV3UsdcVault.aaveV3Pool();

    expect(usdcAddress).to.equal(USDC_ADDRESS);
    expect(aEthUSDCAddress).to.equal(AAVE_ETH_USDC_ADDRESS);
    expect(aaveV3PoolAddress).to.equal(AAVE_V3_ADDRESS);
  });

  it("should successfully deposit USDC to the ERC4626AaveV3UsdcVault contract", async () => {
    const { usdc, aaveV3UsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(aaveV3UsdcVault.getAddress(), ethers.MaxUint256);

    await aaveV3UsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await aaveV3UsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");
  });

  it("should successfully withdraw USDC from the ERC4626AaveV3UsdcVault contract", async () => {
    const { usdc, aaveV3UsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(aaveV3UsdcVault.getAddress(), ethers.MaxUint256);

    await aaveV3UsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await aaveV3UsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(43200);

    const amountToWithdraw = await aaveV3UsdcVault.totalAssets();

    await aaveV3UsdcVault
      .connect(impersonatedWhaleAccount)
      .withdraw(
        amountToWithdraw,
        impersonatedWhaleAccount.getAddress(),
        impersonatedWhaleAccount.getAddress()
      );
  });

  it("should successfully rescue funds from the ERC4626AaveV3UsdcVault contract", async () => {
    const { usdc, aaveV3UsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    const accounts = await ethers.getSigners();

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(aaveV3UsdcVault.getAddress(), ethers.MaxUint256);

    await aaveV3UsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await aaveV3UsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(43200);

    await aaveV3UsdcVault
      .connect(accounts[0])
      .rescueFunds(accounts[0].getAddress());
  });
}).timeout(72000);
