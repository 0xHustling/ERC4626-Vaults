// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {IApeCoinStaking} from "../interfaces/protocols/apecoin/IApeCoinStaking.sol";
import {IERC4626ApeCoinVault} from "../interfaces/vaults/IERC4626ApeCoinVault.sol";

/**
 * @title ERC4626ApeCoinVault
 * @author 0xHustling
 * @dev ERC4626ApeCoinVault is a ERC4626 compliant vault for ApeCoin auto-compounded staking.
 * @dev The ERC4626 "Tokenized Vault Standard" is defined in https://eips.ethereum.org/EIPS/eip-4626[EIP-4626].
 */
contract ERC4626ApeCoinVault is IERC4626ApeCoinVault, ERC4626, Ownable {
    /* ========== STATE VARIABLES ========== */

    address public immutable apeCoin;
    address public immutable apeCoinStaking;

    uint256 public feeBps;

    /* ========== CONSTANTS ========== */

    uint256 private constant MIN_DEPOSIT = 1e18;
    uint256 private constant MAX_FEE_BPS = 1000;

    /* ========== CONSTRUCTOR ========== */

    /**
     * @dev Constructor to initialize the ApeCoinVault.
     * @param _apeCoin ApeCoin contract address.
     * @param _apeCoinStaking ApeCoin Staking contract address.
     * @param _feeBps The admin fee in basis points.
     */
    constructor(IERC20 _apeCoin, address _apeCoinStaking, uint256 _feeBps)
        Ownable(msg.sender)
        ERC4626(_apeCoin)
        ERC20("Staked ApeCoin", "stAPE")
    {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh(_feeBps);

        apeCoin = address(_apeCoin);
        apeCoinStaking = _apeCoinStaking;
        feeBps = _feeBps;

        IERC20(apeCoin).approve(apeCoinStaking, type(uint256).max);
    }

    /* ========== VIEWS ========== */

    /**
     * @dev Get deposited and unclaimed amount from ApeCoin Staking contract.
     * @return A struct containing ApeCoin staking details.
     */
    function getApeCoinStake() public view returns (IApeCoinStaking.DashboardStake memory) {
        return IApeCoinStaking(apeCoinStaking).getApeCoinStake(address(this));
    }

    /**
     * @dev See {IERC4626-totalAssets}.
     */
    function totalAssets() public view override returns (uint256) {
        IApeCoinStaking.DashboardStake memory apeStakeInfo = getApeCoinStake();

        uint256 totalDeposited = apeStakeInfo.deposited;
        uint256 totalUnclaimed = apeStakeInfo.unclaimed;
        uint256 fees = (totalUnclaimed * feeBps) / 10000;

        uint256 currentBalance = IERC20(apeCoin).balanceOf(address(this));

        return ((totalDeposited + totalUnclaimed + currentBalance) - fees);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @dev Harvests ApeCoin Rewards, transfers the admin fee and restakes
     * the accumulated ApeCoin back to ApeCoin Staking.
     */
    function harvestApeCoinRewards() public {
        IApeCoinStaking.DashboardStake memory apeStakeInfo = getApeCoinStake();

        uint256 harvestAmount = apeStakeInfo.unclaimed;
        uint256 fees = (harvestAmount * feeBps) / 10000;

        if (harvestAmount > 0) {
            IApeCoinStaking(apeCoinStaking).claimSelfApeCoin();
            IERC20(apeCoin).transfer(owner(), fees);
        }

        uint256 currentBalance = IERC20(apeCoin).balanceOf(address(this));

        if (currentBalance > MIN_DEPOSIT) {
            IApeCoinStaking(apeCoinStaking).depositSelfApeCoin(currentBalance);
        }

        emit HarvestApeCoinRewards(harvestAmount, fees);
    }

    /**
     * @dev Updates the admin fee in basis points (Bps). Only the contract owner can call this function.
     * @param _newFeeBps The new admin fee in basis points (Bps). It must not exceed 10%.
     */
    function updateFee(uint256 _newFeeBps) external onlyOwner {
        if (_newFeeBps > MAX_FEE_BPS) revert FeeTooHigh(_newFeeBps);

        feeBps = _newFeeBps;

        emit FeeUpdated(_newFeeBps);
    }

    /**
     * @dev Hook called after a user deposits ApeCoin to the vault.
     * Harvests ApeCoin rewards.
     */
    function _afterDeposit() internal {
        harvestApeCoinRewards();
    }

    /**
     * @dev Hook called before a user withdraws ApeCoin from the vault.
     * Harvests ApeCoin rewards and withdraws ApeCoin.
     * @param assets The amount of ApeCoin to be withdrawn.
     */
    function _beforeWithdraw(uint256 assets) internal {
        harvestApeCoinRewards();
        IApeCoinStaking(apeCoinStaking).withdrawSelfApeCoin(assets);
    }

    /**
     * @dev See {ERC4626-_deposit}.
     */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        super._deposit(caller, receiver, assets, shares);
        _afterDeposit();
    }

    /**
     * @dev See {ERC4626-_withdraw}.
     */
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        _beforeWithdraw(assets);
        super._withdraw(caller, receiver, owner, assets, shares);
    }
}
