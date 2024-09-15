// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC4626ConvexUsdcVault {
    struct Config {
        IERC20 usdc;
        address cvx;
        address crv;
        address curveLpToken;
        address curveDepositZap;
        address convexBooster;
        address convexRewards;
        address convexHandler;
        uint256 convexPoolId;
        uint24 uniswapFee;
        address uniswapV3Router;
        address chainlinkDataFeedCVXUSD;
        address chainlinkDataFeedCRVUSD;
    }

    event RescueFunds(uint256 total);
    event RescueRewards(uint256 crvRewards, uint256 cvxRewards);
    event HarvestRewards(uint256 amount);
    event SwapFeeUpdated(uint24 newSwapFee);

    function rescueFunds(address destination) external;

    error ChainlinkPriceZero();
    error ChainlinkIncompleteRound();
    error ChainlinkStalePrice();
}
