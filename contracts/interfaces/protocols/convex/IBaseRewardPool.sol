// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IBaseRewardPool {
    function balanceOf(address account) external view returns (uint256);
    function getReward() external returns (bool);
    function withdrawAllAndUnwrap(bool claim) external;
    function withdrawAndUnwrap(uint256 amount, bool claim) external;
    function earned(address account) external view returns (uint256);
}
