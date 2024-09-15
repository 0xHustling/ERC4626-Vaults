// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC4626CurveEurcVault {
    struct Config {
        IERC20 euroc;
        address ageur;
        address usdc;
        address crv;
        address weth;
        address curveLpToken;
        address curveGauge;
        address curveZap;
        address curveMinter;
        address uniswapV3Router;
        address chainlinkDataFeedCRVUSD;
        address chainlinkDataFeedEURUSD;
        uint24 slippageAndFeeFactor;
    }

    event RescueFunds(uint256 totalUsdc);
    event RescueRewards(uint256 crvRewards);
    event HarvestRewards(uint256 amount);
    event NewSlippageAndFeeFactor(uint24 newSlippageAndFeeFactor);
    event MultihopPathUpdated(bytes newMultihopPath);

    function rescueFunds(address destination) external;

    error ChainlinkPriceZero();
    error ChainlinkIncompleteRound();
    error ChainlinkStalePrice();
}
