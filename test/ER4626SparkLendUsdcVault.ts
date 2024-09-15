import {
  time,
  loadFixture,
  impersonateAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const SLIPPAGE = "10";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const S_DAI_ADDRESS = "0x83F20F44975D03b1b09e64809B757c47f942BEeA";
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const IMPERSONATED_WHALE_ADDRESS = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";

describe("ERC4626SparkLendUsdcVault Tests", () => {
  const deployedContracts = async () => {
    const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);

    const ERC4626SparkLendUsdcVault = await ethers.getContractFactory(
      "ERC4626SparkLendUsdcVault"
    );

    const sparkLendUsdcVault = await upgrades.deployProxy(
      ERC4626SparkLendUsdcVault,
      [USDC_ADDRESS, DAI_ADDRESS, S_DAI_ADDRESS, UNISWAP_V3_ROUTER, SLIPPAGE],
      {
        initializer: "initialize",
      }
    );

    await sparkLendUsdcVault.waitForDeployment();

    await impersonateAccount(IMPERSONATED_WHALE_ADDRESS);

    const impersonatedWhaleAccount = await ethers.getSigner(
      IMPERSONATED_WHALE_ADDRESS
    );

    return {
      usdc,
      sparkLendUsdcVault,
      impersonatedWhaleAccount,
    };
  };

  it("should successfully deploy ERC4626SparkLendUsdcVault with correct configuration", async () => {
    const { sparkLendUsdcVault } = await loadFixture(deployedContracts);

    const usdcAddress = await sparkLendUsdcVault.usdc();
    const daiAddress = await sparkLendUsdcVault.dai();
    const sDaiAddress = await sparkLendUsdcVault.sDai();
    const uniswapV3Router = await sparkLendUsdcVault.uniswapV3Router();

    expect(usdcAddress).to.equal(USDC_ADDRESS);
    expect(daiAddress).to.equal(DAI_ADDRESS);
    expect(sDaiAddress).to.equal(S_DAI_ADDRESS);
    expect(uniswapV3Router).to.equal(UNISWAP_V3_ROUTER);
  });

  it("should successfully deposit USDC to the ERC4626SparkLendUsdcVault contract", async () => {
    const { usdc, sparkLendUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(sparkLendUsdcVault.getAddress(), ethers.MaxUint256);

    await sparkLendUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await sparkLendUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");
  });

  it("should successfully withdraw USDC from the ERC4626SparkLendUsdcVault contract", async () => {
    const { usdc, sparkLendUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(sparkLendUsdcVault.getAddress(), ethers.MaxUint256);

    await sparkLendUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await sparkLendUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000");

    // Travel to the future
    await time.increase(864000);

    const amountToWithdraw = await sparkLendUsdcVault.maxWithdraw(
      impersonatedWhaleAccount.getAddress()
    );

    await sparkLendUsdcVault
      .connect(impersonatedWhaleAccount)
      .withdraw(
        amountToWithdraw,
        impersonatedWhaleAccount.getAddress(),
        impersonatedWhaleAccount.getAddress()
      );
  });

  it("should successfully rescue funds from the ERC4626SparkLendUsdcVault contract", async () => {
    const { usdc, sparkLendUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    const accounts = await ethers.getSigners();

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(sparkLendUsdcVault.getAddress(), ethers.MaxUint256);

    await sparkLendUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await sparkLendUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(43200);

    await sparkLendUsdcVault
      .connect(accounts[0])
      .rescueFunds(accounts[0].getAddress());
  });
}).timeout(72000);
