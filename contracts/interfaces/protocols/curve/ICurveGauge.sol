// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface ICurveGauge {
    function withdraw(uint256 _value) external;
    function user_checkpoint(address addr) external;
    function integrate_fraction(address arg0) external view returns (uint256);
}
