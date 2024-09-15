// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {ICompoundUSDCV3} from "../interfaces/protocols/compound/ICompoundUSDCV3.sol";
import {IERC4626CompoundV3UsdcVault} from "../interfaces/vaults/IERC4626CompoundV3UsdcVault.sol";

/**
 * @title ERC4626CompoundV3UsdcVault
 * @author 0xHustling
 * @dev ERC4626CompoundV3UsdcVault is an ERC4626 compliant vault.
 * @dev The ERC4626 "Tokenized Vault Standard" is defined in https://eips.ethereum.org/EIPS/eip-4626[EIP-4626].
 */
contract ERC4626CompoundV3UsdcVault is IERC4626CompoundV3UsdcVault, ERC4626Upgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using Address for address;

    /* ========== STATE VARIABLES ========== */

    address public usdc;
    address public cUSDCv3;

    /* ========== CONSTRUCTOR ========== */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the ERC4626CompoundV3UsdcVault.
     * @param _usdc USDC contract address.
     * @param _cUSDCv3 Compound USDC V3 contract address.
     */
    function initialize(IERC20 _usdc, address _cUSDCv3) external initializer {
        __Ownable_init(_msgSender());
        __ERC4626_init(_usdc);
        __ERC20_init("Wrapped Compound USDC V3", "wcUSDCv3");

        usdc = address(_usdc);
        cUSDCv3 = _cUSDCv3;
    }

    /* ========== VIEWS ========== */

    /**
     * @dev See {IERC4626-totalAssets}.
     */
    function totalAssets() public view override returns (uint256) {
        return IERC20(cUSDCv3).balanceOf(address(this));
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Rescue any locked funds from the pools
     * @param destination The address where the funds should be sent
     */
    function rescueFunds(address destination) external onlyOwner {
        uint256 totalCUSDC = totalAssets();
        ICompoundUSDCV3(cUSDCv3).withdrawTo(destination, usdc, totalCUSDC);

        emit RescueFunds(totalCUSDC);
    }

    /**
     * @dev Hook called after a user deposits USDC to the vault.
     * @param assets The amount of USDC to be deposited.
     */
    function _afterDeposit(uint256 assets) internal {
        IERC20(usdc).approve(cUSDCv3, assets);
        ICompoundUSDCV3(cUSDCv3).supply(usdc, assets);
    }

    /**
     * @dev Hook called before a user withdraws USDC from the vault.
     * @param assets The amount of USDC to be withdrawn.
     */
    function _beforeWithdraw(uint256 assets) internal {
        ICompoundUSDCV3(cUSDCv3).withdraw(usdc, assets);
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
