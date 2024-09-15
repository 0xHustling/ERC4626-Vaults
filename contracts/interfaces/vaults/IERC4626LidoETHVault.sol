// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IERC4626LidoETHVault {
    event PoolDonation(address sender, uint256 value);
    event RescueFunds(uint256 totalUsdc);
    event SlippageUpdated(uint256 newSlippage);

    function rescueFunds(address destination) external;

    error ChainlinkPriceZero();
    error ChainlinkIncompleteRound();
    error ChainlinkStalePrice();
}
