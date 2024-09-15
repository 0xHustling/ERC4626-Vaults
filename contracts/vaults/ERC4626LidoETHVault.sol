// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {ERC7535} from "../lib/ERC7535.sol";
import {ILido} from "../interfaces/protocols/lido/ILido.sol";
import {ICurveStableSwap} from "../interfaces/protocols/curve/ICurveStableSwap.sol";
import {AggregatorV3Interface} from "../interfaces/protocols/chainlink/AggregatorV3Interface.sol";
import {IERC4626LidoETHVault} from "../interfaces/vaults/IERC4626LidoETHVault.sol";

/**
 * @title ERC4626LidoETHVault
 * @author 0xHustling
 * @dev ERC4626LidoETHVault is an ERC7535 compliant vault.
 * @dev ERC-7535: Native Asset ERC-4626 Tokenized Vault - https://eips.ethereum.org/EIPS/eip-7535
 */
contract ERC4626LidoETHVault is IERC4626LidoETHVault, ERC7535, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using Address for address;

    /* ========== STATE VARIABLES ========== */

    address public stETH;
    address public chainlinkDataFeedstETHETH;
    address public curveStETHETHPool;
    uint256 public slippage;

    /**
     * @notice Function to receive ether, which emits a donation event
     */
    receive() external payable {
        emit PoolDonation(_msgSender(), msg.value);
    }

    /* ========== CONSTRUCTOR ========== */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the ERC4626LidoETHVault
     * @param _stETH Lido Staked ETH contract address.
     */
    function initialize(
        address _stETH,
        address _chainlinkDataFeedstETHETH,
        address _curveStETHETHPool,
        uint256 _slippage
    ) external initializer {
        __Ownable_init(_msgSender());
        __ERC20_init("Wrapped Lido stETH", "wstETH");

        stETH = _stETH;
        chainlinkDataFeedstETHETH = _chainlinkDataFeedstETHETH;
        curveStETHETHPool = _curveStETHETHPool;
        slippage = _slippage;
    }

    /* ========== VIEWS ========== */

    /**
     * @dev See {IERC7535-totalAssets}.
     */
    function totalAssets() public view override returns (uint256) {
        return IERC20(stETH).balanceOf(address(this)) * uint256(stETHPriceETH()) / 1e18;
    }

    /**
     * @notice The stETH/ETH price
     * @return The price of stETH denominated in ETH
     */
    function stETHPriceETH() public view returns (int256) {
        (uint80 roundId, int256 answer, uint256 startedAt,, uint80 answeredInRound) =
            AggregatorV3Interface(chainlinkDataFeedstETHETH).latestRoundData();
        if (answer <= 0) revert ChainlinkPriceZero();
        if (startedAt == 0) revert ChainlinkIncompleteRound();
        if (answeredInRound < roundId) revert ChainlinkStalePrice();

        return answer;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Rescue any locked funds from the pools
     * @param destination The address where the funds should be sent
     */
    function rescueFunds(address destination) external onlyOwner {
        uint256 totalStETH = totalAssets();
        IERC20(stETH).safeTransfer(destination, totalStETH);

        emit RescueFunds(totalStETH);
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
     * @dev Hook called after a user deposits ETH to the vault.
     * @param assets The amount of ETH to be deposited.
     */
    function _afterDeposit(uint256 assets) internal {
        // Sumit ETH to Lido and get stETH in return
        ILido(stETH).submit{value: assets}(owner());
    }

    /**
     * @dev Hook called before a user withdraws ETH from the vault.
     * @param assets The amount of ETH to be withdrawn.
     */
    function _beforeWithdraw(uint256 assets) internal returns (uint256) {
        // Calculate the minimum amount out
        uint256 minAmountOut = assets * (1e36 / uint256(stETHPriceETH())) / 1e18 * (10000 - slippage) / 10000;

        // Approve Curve pool to spend stETH
        IERC20(stETH).approve(curveStETHETHPool, assets);

        // Swap stETH for ETH
        return ICurveStableSwap(curveStETHETHPool).exchange{value: 0}(1, 0, assets, minAmountOut);
    }

    /**
     * @dev See {ERC7535-_deposit}.
     */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        super._deposit(caller, receiver, assets, shares);
        _afterDeposit(assets);
    }

    /**
     * @dev See {ERC7535-_withdraw}.
     */
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        uint256 ethToWithdraw = _beforeWithdraw(assets);
        super._withdraw(caller, receiver, owner, ethToWithdraw, shares);
    }
}
