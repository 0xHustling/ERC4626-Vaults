// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IBenqiUSDCn {
    function balanceOf(address owner) external view returns (uint);
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function getAccountSnapshot(address account) external view returns (uint256, uint256, uint256, uint256);
    function exchangeRateStored() external view returns (uint256);
}
