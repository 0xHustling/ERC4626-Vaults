import { ethers, upgrades } from "hardhat";

async function main() {
  const ERC4626AaveV3UsdcVault = await ethers.getContractFactory(
    "ERC4626AaveV3UsdcVault"
  );

  const aaveV3UsdcVault = await upgrades.deployProxy(
    ERC4626AaveV3UsdcVault,
    [
      process.env.USDC_ADDRESS,
      process.env.AAVE_V3_ADDRESS,
      process.env.AAVE_ETH_USDC_ADDRESS,
    ],
    {
      initializer: "initialize",
    }
  );

  await aaveV3UsdcVault.waitForDeployment();

  console.log(
    `ERC4626AaveV3UsdcVault deployed to: https://etherscan.io/address/${await aaveV3UsdcVault.getAddress()}`
  );

  const ERC4626CompoundV3UsdcVault = await ethers.getContractFactory(
    "ERC4626CompoundV3UsdcVault"
  );

  const compoundV3UsdcVault = await upgrades.deployProxy(
    ERC4626CompoundV3UsdcVault,
    [process.env.USDC_ADDRESS, process.env.C_USDC_V3_ADDRESS],
    {
      initializer: "initialize",
    }
  );

  await compoundV3UsdcVault.waitForDeployment();

  console.log(
    `ERC4626CompoundV3UsdcVault deployed to: https://etherscan.io/address/${await compoundV3UsdcVault.getAddress()}`
  );

  const ERC4626BenqiUsdcVault = await ethers.getContractFactory(
    "ERC4626BenqiUsdcVault"
  );

  const benqiUsdcVault = await upgrades.deployProxy(
    ERC4626BenqiUsdcVault,
    [process.env.USDC_ADDRESS, process.env.BENQI_USDCN_ADDRESS],
    {
      initializer: "initialize",
    }
  );

  await benqiUsdcVault.waitForDeployment();

  console.log(
    `ERC4626BenqiUsdcVault deployed to: https://snowtrace.io/address/${await benqiUsdcVault.getAddress()}`
  );

  const ERC4626SparkLendUsdcVault = await ethers.getContractFactory(
    "ERC4626SparkLendUsdcVault"
  );

  const sparkLendUsdcVault = await upgrades.deployProxy(
    ERC4626SparkLendUsdcVault,
    [
      process.env.USDC_ADDRESS,
      process.env.DAI_ADDRESS,
      process.env.S_DAI_ADDRESS,
      process.env.UNISWAP_V3_ROUTER,
      process.env.SLIPPAGE,
    ],
    {
      initializer: "initialize",
    }
  );

  await sparkLendUsdcVault.waitForDeployment();

  console.log(
    `ERC4626SparkLendUsdcVault deployed to: https://etherscan.io/address/${await sparkLendUsdcVault.getAddress()}`
  );

  const ERC4626ConvexUsdcVault = await ethers.getContractFactory(
    "ERC4626ConvexUsdcVault"
  );

  const convexUsdcVault = await upgrades.deployProxy(
    ERC4626ConvexUsdcVault,
    [
      [
        process.env.USDC_ADDRESS,
        process.env.CVX_ADDRESS,
        process.env.CRV_ADDRESS,
        process.env.CURVE_LP_TOKEN_ADDRESS,
        process.env.CURVE_DEPOSIT_ZAP_ADDRESS,
        process.env.CONVEX_BOOSTER_ADDRESS,
        process.env.CONVEX_REWARDS_ADDRESS,
        process.env.CONVEX_HANDLER_ADDRESS,
        process.env.CONVEX_POOL_ID,
        process.env.UNISWAP_FEE,
        process.env.UNISWAP_V3_ROUTER,
        process.env.CHAINLINK_DATA_FEED_CVX_USD,
        process.env.CHAINLINK_DATA_FEED_CRV_USD,
      ],
    ],
    {
      initializer: "initialize",
    }
  );

  await convexUsdcVault.waitForDeployment();

  console.log(
    `ERC4626ConvexUsdcVault deployed to: https://etherscan.io/address/${await convexUsdcVault.getAddress()}`
  );

  const ERC4626CurveEurcVault = await ethers.getContractFactory(
    "ERC4626CurveEurcVault"
  );

  const curveEurcVault = await upgrades.deployProxy(
    ERC4626CurveEurcVault,
    [
      [
        process.env.EUROC_ADDRESS,
        process.env.AGEUR_ADDRESS,
        process.env.USDC_ADDRESS,
        process.env.CRV_ADDRESS,
        process.env.WETH_ADDRESS,
        process.env.CURVE_LP_TOKEN_ADDRESS,
        process.env.CURVE_GAUGE_ADDRESS,
        process.env.CURVE_ZAP_ADDRESS,
        process.env.CURVE_MINTER_ADDRESS,
        process.env.UNISWAP_V3_ROUTER,
        process.env.CHAINLINK_DATA_FEED_CRV_USD,
        process.env.CHAINLINK_DATA_FEED_EUR_USD,
        process.env.SLIPPAGE_AND_FEE_FACTOR,
      ],
    ],
    {
      initializer: "initialize",
    }
  );

  await curveEurcVault.waitForDeployment();

  console.log(
    `ERC4626CurveEurcVault deployed to: https://etherscan.io/address/${await curveEurcVault.getAddress()}`
  );

  const ERC4626LidoETHVault = await ethers.getContractFactory(
    "ERC4626LidoETHVault"
  );

  const lidoETHVault = await upgrades.deployProxy(
    ERC4626LidoETHVault,
    [
      process.env.STETH_ADDRESS,
      process.env.CHAINLINK_DATA_FEED_STETH_ETH,
      process.env.CURVE_STETH_ETH_POOL_ADDRESS,
      process.env.SLIPPAGE_FACTOR,
    ],
    {
      initializer: "initialize",
    }
  );

  await lidoETHVault.waitForDeployment();

  console.log(
    `ERC4626LidoETHVault deployed to: https://etherscan.io/address/${await lidoETHVault.getAddress()}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
