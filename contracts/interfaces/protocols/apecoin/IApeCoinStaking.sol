// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IApeCoinStaking {
    struct DashboardStake {
        uint256 poolId;
        uint256 tokenId;
        uint256 deposited;
        uint256 unclaimed;
        uint256 rewards24hr;
        DashboardPair pair;
    }

    struct DashboardPair {
        uint256 mainTokenId;
        uint256 mainTypePoolId;
    }

    function depositSelfApeCoin(uint256 _amount) external;
    function withdrawSelfApeCoin(uint256 _amount) external;
    function withdrawApeCoin(uint256 _amount, address _recipient) external;
    function claimSelfApeCoin() external;
    function stakedTotal(address _address) external view returns (uint256);
    function getApeCoinStake(address _address) external view returns (DashboardStake memory);
}
