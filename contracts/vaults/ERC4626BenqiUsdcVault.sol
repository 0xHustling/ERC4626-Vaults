// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IBenqiUSDCn} from "../interfaces/protocols/benqi/IBenqiUSDCn.sol";
import {IERC4626BenqiUsdcVault} from "../interfaces/vaults/IERC4626BenqiUsdcVault.sol";

/**
 * @title ERC4626BenqiUsdcVault
 * @author 0xHustling
 * @dev ERC4626BenqiUsdcVault is an ERC4626 compliant vault.
 * @dev The ERC4626 "Tokenized Vault Standard" is defined in https://eips.ethereum.org/EIPS/eip-4626[EIP-4626].
 */
contract ERC4626BenqiUsdcVault is IERC4626BenqiUsdcVault, ERC4626Upgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using Address for address;

    /* ========== STATE VARIABLES ========== */

    address public usdc;
    address public qiUSDCn;

    /* ========== CONSTRUCTOR ========== */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the ERC4626BenqiUsdcVault.
     * @param _usdc USDC contract address.
     * @param _qiUSDCn Benqi USDCn contract address.
     */
    function initialize(IERC20 _usdc, address _qiUSDCn) external initializer {
        __Ownable_init(_msgSender());
        __ERC4626_init(_usdc);
        __ERC20_init("Wrapped Benqi USDCn", "wQiUSDCn");

        usdc = address(_usdc);
        qiUSDCn = _qiUSDCn;
    }

    /* ========== VIEWS ========== */

    /**
     * @dev See {IERC4626-totalAssets}.
     */
    function totalAssets() public view override returns (uint256) {
        return (IBenqiUSDCn(qiUSDCn).balanceOf(address(this)) * IBenqiUSDCn(qiUSDCn).exchangeRateStored()) / (10 ** 18);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Rescue any locked funds from the pools
     * @param destination The address where the funds should be sent
     */
    function rescueFunds(address destination) external onlyOwner {
        uint256 totalQiUSDCn = IBenqiUSDCn(qiUSDCn).balanceOf(address(this));

        IBenqiUSDCn(qiUSDCn).redeem(totalQiUSDCn);
        IERC20(usdc).safeTransfer(destination, IERC20(usdc).balanceOf(address(this)));

        emit RescueFunds(totalQiUSDCn);
    }

    /**
     * @dev Hook called after a user deposits USDC to the vault.
     * @param assets The amount of USDC to be deposited.
     */
    function _afterDeposit(uint256 assets) internal {
        IERC20(usdc).approve(qiUSDCn, assets);
        IBenqiUSDCn(qiUSDCn).mint(assets);
    }

    /**
     * @dev Hook called before a user withdraws USDC from the vault.
     * @param assets The amount of USDC to be withdrawn.
     */
    function _beforeWithdraw(uint256 assets) internal {
        IBenqiUSDCn(qiUSDCn).redeemUnderlying(assets);
    }

    /**
     * @dev See {ERC4626-_deposit}.
     */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        super._deposit(caller, receiver, assets, shares);
        _afterDeposit(assets);
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
