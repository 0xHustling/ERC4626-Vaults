// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IERC4626CompoundV3UsdcVault {
    event RescueFunds(uint256 total);

    function rescueFunds(address destination) external;
}
