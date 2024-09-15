// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface ICurveZap {
    function deposit_and_stake(
        address deposit,
        address lp_token,
        address gauge,
        uint256 n_coins,
        address[5] memory coins,
        uint256[5] memory amounts,
        uint256 min_mint_amount,
        bool use_underlying,
        address pool
    ) external;
}
