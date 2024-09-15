import {
  time,
  loadFixture,
  impersonateAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const EUROC_ADDRESS = "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c";
const AGEUR_ADDRESS = "0x1a7e4e63778b4f12a199c062f3efdd288afcbce8";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const CRV_ADDRESS = "0xD533a949740bb3306d119CC777fa900bA034cd52";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const CURVE_LP_TOKEN_ADDRESS = "0xBa3436Fd341F2C8A928452Db3C5A3670d1d5Cc73";
const CURVE_ZAP_ADDRESS = "0x271fbE8aB7f1fB262f81C77Ea5303F03DA9d3d6A";
const CURVE_MINTER_ADDRESS = "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0";
const CURVE_GAUGE_ADDRESS = "0xf9f46ef781b9c7b76e8b505226d5e0e0e7fe2f04";
const SLIPPAGE_AND_FEE_FACTOR = "50";
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const CHAINLINK_DATA_FEED_EUR_USD =
  "0xb49f677943BC038e9857d61E7d053CaA2C1734C1";
const CHAINLINK_DATA_FEED_CRV_USD =
  "0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f";
const IMPERSONATED_WHALE_ADDRESS = "0x55FE002aefF02F77364de339a1292923A15844B8";

describe("ERC4626CurveEurcVault Tests", () => {
  const deployedContracts = async () => {
    const euroc = await ethers.getContractAt("MockUSDC", EUROC_ADDRESS);

    const ERC4626CurveEurcVault = await ethers.getContractFactory(
      "ERC4626CurveEurcVault"
    );

    const curveEurcVault = await upgrades.deployProxy(
      ERC4626CurveEurcVault,
      [
        {
          euroc: EUROC_ADDRESS,
          ageur: AGEUR_ADDRESS,
          usdc: USDC_ADDRESS,
          crv: CRV_ADDRESS,
          weth: WETH_ADDRESS,
          curveLpToken: CURVE_LP_TOKEN_ADDRESS,
          curveGauge: CURVE_GAUGE_ADDRESS,
          curveZap: CURVE_ZAP_ADDRESS,
          curveMinter: CURVE_MINTER_ADDRESS,
          uniswapV3Router: UNISWAP_V3_ROUTER,
          chainlinkDataFeedCRVUSD: CHAINLINK_DATA_FEED_CRV_USD,
          chainlinkDataFeedEURUSD: CHAINLINK_DATA_FEED_EUR_USD,
          slippageAndFeeFactor: SLIPPAGE_AND_FEE_FACTOR,
        },
      ],
      {
        initializer: "initialize",
      }
    );

    await curveEurcVault.waitForDeployment();

    await impersonateAccount(IMPERSONATED_WHALE_ADDRESS);

    const impersonatedWhaleAccount = await ethers.getSigner(
      IMPERSONATED_WHALE_ADDRESS
    );

    return {
      euroc,
      curveEurcVault,
      impersonatedWhaleAccount,
    };
  };

  it("should successfully deploy ERC4626CurveEurcVault with correct configuration", async () => {
    const { curveEurcVault } = await loadFixture(deployedContracts);

    const usdcAddress = await curveEurcVault.usdc();
    const crvAddress = await curveEurcVault.crv();
    const curveLpTokenAddress = await curveEurcVault.curveLpToken();
    const curveZapAddress = await curveEurcVault.curveZap();
    const uniswapV3Router = await curveEurcVault.uniswapV3Router();

    expect(usdcAddress).to.equal(USDC_ADDRESS);
    expect(crvAddress).to.equal(CRV_ADDRESS);
    expect(curveLpTokenAddress).to.equal(CURVE_LP_TOKEN_ADDRESS);
    expect(curveZapAddress).to.equal(CURVE_ZAP_ADDRESS);
    expect(uniswapV3Router).to.equal(UNISWAP_V3_ROUTER);
  });

  it("should successfully deposit EURC to the ERC4626CurveEurcVault contract", async () => {
    const { euroc, curveEurcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await euroc
      .connect(impersonatedWhaleAccount)
      .approve(await curveEurcVault.getAddress(), ethers.MaxUint256);

    await curveEurcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000", await impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await curveEurcVault.balanceOf(
      await impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000");
  });

  it("should successfully withdraw EURC from the ERC4626CurveEurcVault contract", async () => {
    const { euroc, curveEurcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await euroc
      .connect(impersonatedWhaleAccount)
      .approve(curveEurcVault.getAddress(), ethers.MaxUint256);

    await curveEurcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await curveEurcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000");

    // Travel to the future
    await time.increase(86400);

    const amountToWithdraw = await curveEurcVault.maxWithdraw(
      impersonatedWhaleAccount.getAddress()
    );

    await curveEurcVault
      .connect(impersonatedWhaleAccount)
      .withdraw(
        amountToWithdraw,
        impersonatedWhaleAccount.getAddress(),
        impersonatedWhaleAccount.getAddress()
      );
  });

  it("should successfully rescue funds from the ERC4626CurveEurcVault contract", async () => {
    const { euroc, curveEurcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    const accounts = await ethers.getSigners();

    await euroc
      .connect(impersonatedWhaleAccount)
      .approve(curveEurcVault.getAddress(), ethers.MaxUint256);

    await curveEurcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await curveEurcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(86400);

    await curveEurcVault
      .connect(accounts[0])
      .rescueFunds(accounts[0].getAddress());
  });

  it("should successfully rescue rewards from the ERC4626CurveEurcVault contract", async () => {
    const { euroc, curveEurcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    const accounts = await ethers.getSigners();

    await euroc
      .connect(impersonatedWhaleAccount)
      .approve(curveEurcVault.getAddress(), ethers.MaxUint256);

    await curveEurcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await curveEurcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000");

    // Travel to the future
    await time.increase(86400);

    await expect(
      await curveEurcVault
        .connect(accounts[0])
        .rescueRewards(accounts[0].getAddress())
    ).to.be.emit(curveEurcVault, "RescueRewards");
  });

  it("should successfully harvest CRV rewards, swap for EURC and deposit back to Curve Finance", async () => {
    const { euroc, curveEurcVault, impersonatedWhaleAccount } =
      await loadFixture(deployedContracts);

    await euroc
      .connect(impersonatedWhaleAccount)
      .approve(curveEurcVault.getAddress(), ethers.MaxUint256);

    await curveEurcVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000", impersonatedWhaleAccount.getAddress());

    const suppliedAmount = await curveEurcVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000");

    // Travel to the future
    await time.increase(86400);

    await expect(
      await curveEurcVault
        .connect(impersonatedWhaleAccount)
        .harvestAndDepositRewards()
    ).to.be.emit(curveEurcVault, "HarvestRewards");
  });
}).timeout(72000);
