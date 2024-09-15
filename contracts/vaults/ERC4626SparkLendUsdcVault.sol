// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";

import {ISwapRouter} from "../interfaces/protocols/uniswap/ISwapRouter.sol";
import {IERC4626SparkLendUsdcVault} from "../interfaces/vaults/IERC4626SparkLendUsdcVault.sol";

/**
 * @title ERC4626SparkLendUsdcVault
 * @author 0xHustling
 * @dev ERC4626SparkLendUsdcVault is an ERC4626 compliant vault.
 * @dev The ERC4626 "Tokenized Vault Standard" is defined in https://eips.ethereum.org/EIPS/eip-4626[EIP-4626].
 */
contract ERC4626SparkLendUsdcVault is IERC4626SparkLendUsdcVault, ERC4626Upgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using Address for address;

    /* ========== STATE VARIABLES ========== */

    address public usdc;
    address public dai;
    address public sDai;
    address public uniswapV3Router;

    uint256 public slippage;

    /* ========== CONSTRUCTOR ========== */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the ERC4626SparkLendUsdcVault.
     * @param _usdc USDC contract address.
     * @param _dai DAI contract address
     * @param _sDai Spark DAI contract address.
     * @param _uniswapV3Router The Uniswap V3 router address.
     * @param _slippage The slippage factor
     */
    function initialize(IERC20 _usdc, address _dai, address _sDai, address _uniswapV3Router, uint256 _slippage)
        external
        initializer
    {
        __Ownable_init(_msgSender());
        __ERC4626_init(_usdc);
        __ERC20_init("Wrapped SparkLend USDC", "wUSDC");

        usdc = address(_usdc);
        dai = _dai;
        sDai = _sDai;
        uniswapV3Router = _uniswapV3Router;
        slippage = _slippage;
    }

    /* ========== VIEWS ========== */

    /**
     * @dev See {IERC4626-totalAssets}.
     * We assume USDC to DAI is 1:1
     */
    function totalAssets() public view override returns (uint256) {
        return (IERC4626(sDai).maxWithdraw(address(this)) / 10 ** 12);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Rescue any locked funds from the pools
     * @param destination The address where the funds should be sent
     */
    function rescueFunds(address destination) external onlyOwner {
        uint256 totalDAI = totalAssets();
        IERC4626(sDai).withdraw(totalDAI, destination, address(this));

        emit RescueFunds(totalDAI);
    }

    /**
     * @notice Set slippage when executing an Uniswap trade
     * @param newSlippage The new slippage configuration
     */
    function setSlippage(uint256 newSlippage) external onlyOwner {
        slippage = newSlippage;

        emit SlippageUpdated(newSlippage);
    }

    /**
     * @notice Swap function for the underlying token (USDC) and DAI
     * @param tokenIn The address of the token to be swapped
     * @param tokenOut The address of the token to be received
     * @param amountIn The amount of token to be swapped
     * @param amountOutMinimum The minimum amount of token to be received
     * @param swapFee The swap fee
     * @return amountOut The amount of tokens received from the swap
     */
    function _swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMinimum, uint24 swapFee)
        internal
        returns (uint256 amountOut)
    {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: swapFee,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        amountOut = ISwapRouter(uniswapV3Router).exactInputSingle(params);
    }

    /**
     * @dev Hook called after a user deposits USDC to the vault.
     * @param assets The amount of USDC to be deposited.
     */
    function _afterDeposit(uint256 assets) internal {
        uint256 amountOutMinimum = ((10000 - slippage) * (assets * 10 ** 12)) / 10000;

        IERC20(usdc).approve(uniswapV3Router, assets);
        uint256 daiAmount = _swap(usdc, dai, assets, amountOutMinimum, 100);

        IERC20(dai).approve(sDai, daiAmount);
        IERC4626(sDai).deposit(daiAmount, address(this));
    }

    /**
     * @dev Hook called before a user withdraws USDC from the vault.
     * @param assets The amount of USDC to be withdrawn.
     */
    function _beforeWithdraw(uint256 assets) internal returns (uint256 usdcAmount) {
        IERC4626(sDai).withdraw((assets * 10 ** 12), address(this), address(this));

        uint256 amountOutMinimum = ((10000 - slippage) * (assets)) / 10000;

        IERC20(dai).approve(uniswapV3Router, assets * 10 ** 12);
        usdcAmount = _swap(dai, usdc, assets * 10 ** 12, amountOutMinimum, 100);
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
        uint256 usdcToWithdraw = _beforeWithdraw(assets);
        super._withdraw(caller, receiver, owner, usdcToWithdraw, shares);
    }
}
