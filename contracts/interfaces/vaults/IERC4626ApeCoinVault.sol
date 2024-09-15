// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IApeCoinStaking} from "../../interfaces/protocols/apecoin/IApeCoinStaking.sol";

interface IERC4626ApeCoinVault {
    event FeeUpdated(uint256 newFeeBps);
    event HarvestApeCoinRewards(uint256 harvestAmount, uint256 fee);

    function harvestApeCoinRewards() external;
    function updateFee(uint256 _newFeeBps) external;
    function getApeCoinStake() external view returns (IApeCoinStaking.DashboardStake memory);

    error FeeTooHigh(uint256 newFeeBps);
}
