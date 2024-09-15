// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface ICurvePool {
    function get_virtual_price() external view returns (uint256);
    function remove_liquidity_one_coin(uint256 _burn_amount, int128 i, uint256 min_received)
        external
        returns (uint256);
}
