import {
  time,
  loadFixture,
  impersonateAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const IMPERSONATED_WHALE_ADDRESS = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";

const STETH_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const CHAINLINK_FEED_ADDRESS = "0x86392dC19c0b719886221c78AB11eb8Cf5c52812";
const CURVE_STETH_ETH_POOL_ADDRESS =
  "0xDC24316b9AE028F1497c275EB9192a3Ea0f67022";
const SLIPPAGE = 30;

describe("ERC4626LidoETHVaul Tests", () => {
  const deployedContracts = async () => {
    const stETH = await ethers.getContractAt("MockUSDC", STETH_ADDRESS);

    const ERC4626LidoETHVault = await ethers.getContractFactory(
      "ERC4626LidoETHVault"
    );

    const lidoEthVault = await upgrades.deployProxy(
      ERC4626LidoETHVault,
      [
        STETH_ADDRESS,
        CHAINLINK_FEED_ADDRESS,
        CURVE_STETH_ETH_POOL_ADDRESS,
        SLIPPAGE,
      ],
      {
        initializer: "initialize",
      }
    );

    await lidoEthVault.waitForDeployment();

    await impersonateAccount(IMPERSONATED_WHALE_ADDRESS);

    const impersonatedWhaleAccount = await ethers.getSigner(
      IMPERSONATED_WHALE_ADDRESS
    );

    return {
      stETH,
      lidoEthVault,
      impersonatedWhaleAccount,
    };
  };

  it("should successfully deploy ERC4626LidoETHVault with correct configuration", async () => {
    const { lidoEthVault } = await loadFixture(deployedContracts);

    const stETHAddress = await lidoEthVault.stETH();
    const curvePool = await lidoEthVault.curveStETHETHPool();
    const chainlinkDataFeed = await lidoEthVault.chainlinkDataFeedstETHETH();

    expect(stETHAddress).to.equal(STETH_ADDRESS);
    expect(curvePool).to.equal(CURVE_STETH_ETH_POOL_ADDRESS);
    expect(chainlinkDataFeed).to.equal(CHAINLINK_FEED_ADDRESS);
  });

  it("should successfully deposit ETH to the ERC4626LidoETHVault contract", async () => {
    const { lidoEthVault, impersonatedWhaleAccount } = await loadFixture(
      deployedContracts
    );

    await lidoEthVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000000000", impersonatedWhaleAccount.getAddress(), {
        value: "1000000000000000000",
      });

    const suppliedAmount = await lidoEthVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000000000");
  });

  it("should successfully withdraw ETH from the ERC4626LidoETHVault contract", async () => {
    const { lidoEthVault, impersonatedWhaleAccount } = await loadFixture(
      deployedContracts
    );

    await lidoEthVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000000000", impersonatedWhaleAccount.getAddress(), {
        value: "1000000000000000000",
      });

    const suppliedAmount = await lidoEthVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000000000");

    // Travel to the future
    await time.increase(86400);

    const amountToWithdraw = await lidoEthVault.totalAssets();

    await lidoEthVault
      .connect(impersonatedWhaleAccount)
      .withdraw(
        amountToWithdraw,
        impersonatedWhaleAccount.getAddress(),
        impersonatedWhaleAccount.getAddress()
      );
  });

  it("should successfully rescue funds from the ERC4626LidoETHVault contract", async () => {
    const { lidoEthVault, impersonatedWhaleAccount } = await loadFixture(
      deployedContracts
    );

    const accounts = await ethers.getSigners();

    await lidoEthVault
      .connect(impersonatedWhaleAccount)
      .deposit("1000000000000000000", impersonatedWhaleAccount.getAddress(), {
        value: "1000000000000000000",
      });

    const suppliedAmount = await lidoEthVault.balanceOf(
      impersonatedWhaleAccount.getAddress()
    );

    expect(suppliedAmount).to.equal("1000000000000000000");

    // Travel to the future
    await time.increase(86400);

    await lidoEthVault
      .connect(accounts[0])
      .rescueFunds(accounts[0].getAddress());
  });
}).timeout(72000);
