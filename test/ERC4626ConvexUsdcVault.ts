import {
  time,
  loadFixture,
  impersonateAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const CVX_ADDRESS = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
const CRV_ADDRESS = "0xD533a949740bb3306d119CC777fa900bA034cd52";
const CURVE_LP_TOKEN_ADDRESS = "0x5a6A4D54456819380173272A5E8E9B9904BdF41B";
const CURVE_DEPOSIT_ZAP_ADDRESS = "0xA79828DF1850E8a3A3064576f380D90aECDD3359";
const CONVEX_BOOSTER_ADDRESS = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";
const CONVEX_REWARDS_ADDRESS = "0xFd5AbF66b003881b88567EB9Ed9c651F14Dc4771";
const CONVEX_HANDLER_ADDRESS = "0x635228EDAEAd8a76b6ae1779bd7682043321943D";
const CONVEX_POOL_ID = "40";
const UNISWAP_FEE = "10000";
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const CHAINLINK_DATA_FEED_CVX_USD =
  "0xd962fC30A72A84cE50161031391756Bf2876Af5D";
const CHAINLINK_DATA_FEED_CRV_USD =
  "0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f";
const IMPERSONATED_WHALE_ADDRESS = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";

describe("ERC4626ConvexUsdcVault Tests", () => {
  const deployedContracts = async () => {
    const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);

    const ERC4626ConvexUsdcVault = await ethers.getContractFactory(
      "ERC4626ConvexUsdcVault"
    );

    const convexUsdcVault = await upgrades.deployProxy(
      ERC4626ConvexUsdcVault,
      [
        {
          usdc: USDC_ADDRESS,
          cvx: CVX_ADDRESS,
          crv: CRV_ADDRESS,
          curveLpToken: CURVE_LP_TOKEN_ADDRESS,
          curveDepositZap: CURVE_DEPOSIT_ZAP_ADDRESS,
          convexBooster: CONVEX_BOOSTER_ADDRESS,
          convexRewards: CONVEX_REWARDS_ADDRESS,
          convexHandler: CONVEX_HANDLER_ADDRESS,
          convexPoolId: CONVEX_POOL_ID,
          uniswapFee: UNISWAP_FEE,
          uniswapV3Router: UNISWAP_V3_ROUTER,
          chainlinkDataFeedCVXUSD: CHAINLINK_DATA_FEED_CVX_USD,
          chainlinkDataFeedCRVUSD: CHAINLINK_DATA_FEED_CRV_USD,
        },
      ],
      {
        initializer: "initialize",
      }
    );

    await convexUsdcVault.waitForDeployment();

    await impersonateAccount(IMPERSONATED_WHALE_ADDRESS);

    const impersonatedWhaleAccount = await ethers.getSigner(
      IMPERSONATED_WHALE_ADDRESS
    );

    return {
      usdc,
      convexUsdcVault,
      impersonatedWhaleAccount,
    };
  };

  it("should successfully deploy ERC4626ConvexUsdcVault with correct configuration", async () => {
    const { convexUsdcVault } = await loadFixture(deployedContracts);

    const usdcAddress = await convexUsdcVault.usdc();
    const crvAddress = await convexUsdcVault.crv();
    const cvxAddress = await convexUsdcVault.cvx();
    const curveLpTokenAddress = await convexUsdcVault.curveLpToken();
    const curveDepositZapAddress = await convexUsdcVault.curveDepositZap();
    const uniswapV3Router = await convexUsdcVault.uniswapV3Router();

    expect(usdcAddress).to.equal(USDC_ADDRESS);
    expect(crvAddress).to.equal(CRV_ADDRESS);
    expect(cvxAddress).to.equal(CVX_ADDRESS);
    expect(curveLpTokenAddress).to.equal(CURVE_LP_TOKEN_ADDRESS);
    expect(curveDepositZapAddress).to.equal(CURVE_DEPOSIT_ZAP_ADDRESS);
    expect(uniswapV3Router).to.equal(UNISWAP_V3_ROUTER);
  });

  it("should successfully deposit USDC to the ERC4626ConvexUsdcVault contract", async () => {
    const { usdc, convexUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(await convexUsdcVault.getAddress(), ethers.MaxUint256);

    await convexUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000", await impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await convexUsdcVault.balanceOf(
      await impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000");
  });

  it("should successfully withdraw USDC from the ERC4626ConvexUsdcVault contract", async () => {
    const { usdc, convexUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(convexUsdcVault.getAddress(), ethers.MaxUint256);

    await convexUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("100000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await convexUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("100000000000");

    // Travel to the future
    await time.increase(86400);

    const amountToWithdraw = await convexUsdcVault.maxWithdraw(
      impersonatedWhaleAccount.getAddress()
    );

    await convexUsdcVault
      .connect(impersonatedWhaleAccount)
      .withdraw(
        amountToWithdraw,
        impersonatedWhaleAccount.getAddress(),
        impersonatedWhaleAccount.getAddress()
      );
  });

  it("should successfully rescue funds from the ERC4626ConvexUsdcVault contract", async () => {
    const { usdc, convexUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    const accounts = await ethers.getSigners();

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(convexUsdcVault.getAddress(), ethers.MaxUint256);

    await convexUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await convexUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(86400);

    await convexUsdcVault
      .connect(accounts[0])
      .rescueFunds(accounts[0].getAddress());
  });

  it("should successfully rescue rewards from the ERC4626ConvexUsdcVault contract", async () => {
    const { usdc, convexUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    const accounts = await ethers.getSigners();

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(convexUsdcVault.getAddress(), ethers.MaxUint256);

    await convexUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await convexUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(86400);

    await expect(
      await convexUsdcVault
        .connect(accounts[0])
        .rescueRewards(accounts[0].getAddress())
    ).to.be.emit(convexUsdcVault, "RescueRewards");
  });

  it("should successfully harvest CRV and CVX rewards, swap for USDC and deposit back to Convex Finance", async () => {
    const { usdc, convexUsdcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await usdc
      .connect(impersonatedWhaleAccount)
      .approve(convexUsdcVault.getAddress(), ethers.MaxUint256);

    await convexUsdcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await convexUsdcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(86400);

    await expect(
      await convexUsdcVault
        .connect(impersonatedWhaleAccount)
        .harvestAndDepositRewards()
    ).to.be.emit(convexUsdcVault, "HarvestRewards");
  });
}).timeout(72000);
