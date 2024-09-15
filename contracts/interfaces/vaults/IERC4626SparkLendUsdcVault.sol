// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IERC4626SparkLendUsdcVault {
    event RescueFunds(uint256 totalDai);
    event SlippageUpdated(uint256 newSlippage);

    function rescueFunds(address destination) external;
}
