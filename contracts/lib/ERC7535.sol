// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20, IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {IERC7535} from "../interfaces/lib/IERC7535.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title ERC-7535: Native Asset ERC-4626 Tokenized Vault - https://eips.ethereum.org/EIPS/eip-7535
 * @notice ERC-4626 Tokenized Vaults with Ether (Native Asset) as the underlying asset
 */
abstract contract ERC7535 is ERC20Upgradeable, IERC7535 {
    using Math for uint256;

    /**
     * @dev Attempted to deposit more assets than the max amount for `receiver`.
     */
    error ERC7535ExceededMaxDeposit(address receiver, uint256 assets, uint256 max);

    /**
     * @dev Attempted to mint more shares than the max amount for `receiver`.
     */
    error ERC7535ExceededMaxMint(address receiver, uint256 shares, uint256 max);

    /**
     * @dev Attempted to withdraw more assets than the max amount for `receiver`.
     */
    error ERC7535ExceededMaxWithdraw(address owner, uint256 assets, uint256 max);

    /**
     * @dev Attempted to redeem more shares than the max amount for `receiver`.
     */
    error ERC7535ExceededMaxRedeem(address owner, uint256 shares, uint256 max);

    /**
     * @dev Decimals are computed by adding the decimal offset on top of the underlying asset's decimals. This
     * "original" value is cached during construction of the vault contract. If this read operation fails (e.g., the
     * asset has not been created yet), a default of 18 is used to represent the underlying asset's decimals.
     *
     * See {IERC20Metadata-decimals}.
     */
    function decimals() public view virtual override(IERC20Metadata, ERC20Upgradeable) returns (uint8) {
        return 18 + _decimalsOffset();
    }

    /**
     * @dev See {IERC7535-asset}.
     */
    function asset() public view virtual returns (address) {
        return address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    }

    /**
     * @dev See {IERC7535-totalAssets}.
     */
    function totalAssets() public view virtual returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev See {IERC7535-convertToShares}.
     */
    function convertToShares(uint256 assets) public view virtual returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    /**
     * @dev See {IERC7535-convertToAssets}.
     */
    function convertToAssets(uint256 shares) public view virtual returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /**
     * @dev See {IERC7535-maxDeposit}.
     */
    function maxDeposit(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    /**
     * @dev See {IERC7535-maxMint}.
     */
    function maxMint(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    /**
     * @dev See {IERC7535-maxWithdraw}.
     */
    function maxWithdraw(address owner) public view virtual returns (uint256) {
        return _convertToAssets(balanceOf(owner), Math.Rounding.Floor);
    }

    /**
     * @dev See {IERC7535-maxRedeem}.
     */
    function maxRedeem(address owner) public view virtual returns (uint256) {
        return balanceOf(owner);
    }

    /**
     * @dev See {IERC7535-previewDeposit}.
     */
    function previewDeposit(uint256 assets) public view virtual returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    /**
     * @dev See {IERC7535-previewMint}.
     */
    function previewMint(uint256 shares) public view virtual returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Ceil);
    }

    /**
     * @dev See {IERC7535-previewWithdraw}.
     */
    function previewWithdraw(uint256 assets) public view virtual returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Ceil);
    }

    /**
     * @dev See {IERC7535-previewRedeem}.
     */
    function previewRedeem(uint256 shares) public view virtual returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /**
     * @dev See {IERC7535-deposit}.
     */
    function deposit(uint256 assets, address receiver) public payable virtual returns (uint256) {
        uint256 maxAssets = maxDeposit(receiver);
        if (assets > maxAssets) {
            revert ERC7535ExceededMaxDeposit(receiver, assets, maxAssets);
        }

        uint256 shares = previewDeposit(assets);

        if (assets != msg.value) revert AssetsShouldBeEqualToMsgVaule();

        _deposit(_msgSender(), receiver, assets, shares);

        return shares;
    }

    /**
     * @dev See {IERC7535-mint}.
     *
     * As opposed to {deposit}, minting is allowed even if the vault is in a state where the price of a share is zero.
     * In this case, the shares will be minted without requiring any assets to be deposited.
     */
    function mint(uint256 shares, address receiver) public payable virtual returns (uint256) {
        uint256 maxShares = maxMint(receiver);
        if (shares > maxShares) {
            revert ERC7535ExceededMaxMint(receiver, shares, maxShares);
        }

        uint256 assets = previewMint(shares);

        if (assets != msg.value) revert AssetsShouldBeEqualToMsgVaule();

        _deposit(_msgSender(), receiver, assets, shares);

        return assets;
    }

    /**
     * @dev See {IERC7535-withdraw}.
     */
    function withdraw(uint256 assets, address receiver, address owner) public virtual returns (uint256) {
        uint256 maxAssets = maxWithdraw(owner);
        if (assets > maxAssets) {
            revert ERC7535ExceededMaxWithdraw(owner, assets, maxAssets);
        }

        uint256 shares = previewWithdraw(assets);
        _withdraw(_msgSender(), receiver, owner, assets, shares);

        return shares;
    }

    /**
     * @dev See {IERC7535-redeem}.
     */
    function redeem(uint256 shares, address receiver, address owner) public virtual returns (uint256) {
        uint256 maxShares = maxRedeem(owner);
        if (shares > maxShares) {
            revert ERC7535ExceededMaxRedeem(owner, shares, maxShares);
        }

        uint256 assets = previewRedeem(shares);
        _withdraw(_msgSender(), receiver, owner, assets, shares);

        return assets;
    }

    /**
     * @dev Internal conversion function (from assets to shares) with support for rounding direction.
     */
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view virtual returns (uint256) {
        return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
    }

    /**
     * @dev Internal conversion function (from shares to assets) with support for rounding direction.
     */
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view virtual returns (uint256) {
        return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
    }

    /**
     * @dev Deposit/mint common workflow.
     */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal virtual {
        _mint(receiver, shares);

        emit Deposit(caller, receiver, assets, shares);
    }

    /**
     * @dev Withdraw/redeem common workflow.
     */
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        virtual
    {
        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        _burn(owner, shares);
        (bool success,) = receiver.call{value: assets}("");
        if (!success) revert WithdrawFailed();

        emit Withdraw(caller, receiver, owner, assets, shares);
    }

    function _decimalsOffset() internal view virtual returns (uint8) {
        return 0;
    }
}
