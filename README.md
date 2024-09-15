# ERC4626 Vault Integrations

This repository contains collection of ERC4626 vault integrations with popular protocols like Aave, Compound, Convex, Benqi, Curve, SparkLend and ApeCoin.

## ERC4626AaveV3UsdcVault.sol

Aave V3 ERC-4626 Tokenized Vault.

## ERC4626BenqiUsdcVault.sol

Benqi ERC-4626 Tokenized Vault.

## ERC4626CompoundV3UsdcVault.sol

Compound V3 ERC-4626 Tokenized Vault.

## ERC4626ConvexUsdcVault.sol

Convex ERC-4626 Tokenized Vault.

## ERC4626CurveEurcVault.sol

Curve ERC-4626 Tokenized Vault.

## ERC4626SparkLendUsdcVault.sol

SparkLend ERC-4626 Tokenized Vault.

## ERC4626LidoETHVault.sol

Lido ERC-7535 Native Asset Tokenized Vault.

## ERC4626ApeCoinVault.sol

ApeCoin ERC-4626 Tokenized Vault.

### Installation

```console
$ yarn
```

### Compile

```console
$ yarn compile
```

This task will compile all smart contracts in the `contracts` directory.
ABI files will be automatically exported in `artifacts` directory.

### Testing

```console
$ yarn test
```

### Code coverage

```console
$ yarn coverage
```

The report will be printed in the console and a static website containing full report will be generated in `coverage` directory.

### Code style

```console
$ yarn prettier
```

### Verify & Publish contract source code

```console
$ npx hardhat  verify --network mainnet $CONTRACT_ADDRESS $CONSTRUCTOR_ARGUMENTS
```
