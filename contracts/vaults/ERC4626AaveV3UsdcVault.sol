// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IAaveV3Pool} from "../interfaces/protocols/aave/IAaveV3Pool.sol";
import {IERC4626AaveV3UsdcVault} from "../interfaces/vaults/IERC4626AaveV3UsdcVault.sol";

/**
 * @title ERC4626AaveV3UsdcVault
 * @author 0xHustling
 * @dev ERC4626AaveV3UsdcVault is an ERC4626 compliant vault.
 * @dev The ERC4626 "Tokenized Vault Standard" is defined in https://eips.ethereum.org/EIPS/eip-4626[EIP-4626].
 */
contract ERC4626AaveV3UsdcVault is IERC4626AaveV3UsdcVault, ERC4626Upgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using Address for address;

    /* ========== STATE VARIABLES ========== */

    address public usdc;
    address public aEthUSDC;
    address public aaveV3Pool;

    /* ========== CONSTRUCTOR ========== */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the ERC4626AaveV3UsdcVault.
     * @param _usdc USDC contract address.
     * @param _aaveV3Pool Aave V3 Pool contract address.
     * @param _aEthUSDC Aave Ethereum USDC address.
     */
    function initialize(IERC20 _usdc, address _aaveV3Pool, address _aEthUSDC) external initializer {
        __Ownable_init(_msgSender());
        __ERC4626_init(_usdc);
        __ERC20_init("Wrapped Aave USDC V3", "wAEthUSDC");

        usdc = address(_usdc);
        aaveV3Pool = _aaveV3Pool;
        aEthUSDC = _aEthUSDC;
    }

    /* ========== VIEWS ========== */

    /**
     * @dev See {IERC4626-totalAssets}.
     */
    function totalAssets() public view override returns (uint256) {
        return IERC20(aEthUSDC).balanceOf(address(this));
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Rescue any locked funds from the pools
     * @param destination The address where the funds should be sent
     */
    function rescueFunds(address destination) external onlyOwner {
        uint256 totalAEthUSDC = totalAssets();
        IAaveV3Pool(aaveV3Pool).withdraw(usdc, totalAEthUSDC, destination);

        emit RescueFunds(totalAEthUSDC);
    }

    /**
     * @dev Hook called after a user deposits USDC to the vault.
     * @param assets The amount of USDC to be deposited.
     */
    function _afterDeposit(uint256 assets) internal {
        IERC20(usdc).approve(aaveV3Pool, assets);
        IAaveV3Pool(aaveV3Pool).supply(usdc, assets, address(this), 0);
    }

    /**
     * @dev Hook called before a user withdraws USDC from the vault.
     * @param assets The amount of USDC to be withdrawn.
     */
    function _beforeWithdraw(uint256 assets) internal {
        IAaveV3Pool(aaveV3Pool).withdraw(usdc, assets, address(this));
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
