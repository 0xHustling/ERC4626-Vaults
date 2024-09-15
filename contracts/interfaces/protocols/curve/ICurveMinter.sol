// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface ICurveMinter {
    function mint(address gauge_addr) external;
    function minted(address _for, address gauge_addr) external view returns (uint256);
}
