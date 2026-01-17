# @lamdanghoang/sui-pay

Pay Walrus storage costs with SUI directly — no need to acquire WAL tokens separately.

This SDK provides automatic SUI → WAL swapping using Pyth Oracle for real-time pricing, making it seamless for users to pay for Walrus decentralized storage.

## Features

- 🔄 **Automatic SUI → WAL swap** via Pyth Oracle pricing
- 💰 **Accurate cost estimation** using Walrus pricing formula
- 🔌 **Wallet agnostic** — works with any Sui wallet
- 📦 **Zero WAL required** — users only need SUI
- ⚡ **Single transaction** swap execution

## Installation

```bash
npm install @lamdanghoang/sui-pay @mysten/sui
```

## Quick Start

```typescript
import { WalrusSuiPay } from '@lamdanghoang/sui-pay'

// Initialize the client
const client = new WalrusSuiPay({
  network: 'testnet',
  exchangePackageId: '0x...', // Your deployed contract
  exchangeObjectId: '0x...', // Your exchange object
})

// Check if user has enough WAL, get SUI needed if not
const check = await client.checkBalance(
  userAddress,
  fileSize,  // bytes
  3          // epochs
)

if (!check.sufficient) {
  console.log(`Need to swap ${check.suiNeeded} SUI for WAL`)
}

// Ensure WAL balance before upload (auto-swaps if needed)
const result = await client.ensureWalBalance(
  fileSize,
  epochs,
  userAddress,
  signAndExecute  // Your wallet's signing function
)

if (result.success) {
  // Now upload to Walrus...
}
```

## API Reference

### `WalrusSuiPay`

Main client class for swap operations.

#### Constructor

```typescript
new WalrusSuiPay({
  network?: 'testnet' | 'mainnet',  // Default: 'testnet'
  rpcUrl?: string,                   // Custom RPC URL
  exchangePackageId: string,         // WAL Exchange contract package ID
  exchangeObjectId: string,          // WAL Exchange object ID
})
```

#### Methods

##### `getWalBalance(address: string): Promise<bigint>`
Get WAL balance for an address (in FROST, 1 WAL = 1e9 FROST).

##### `getSuiBalance(address: string): Promise<bigint>`
Get SUI balance for an address.

##### `quoteSuiToWal(suiAmount: bigint): Promise<SwapQuote | null>`
Get a quote for swapping SUI to WAL.

##### `quoteWalToSui(walAmount: bigint): Promise<SwapQuote | null>`
Get a quote for swapping WAL to SUI.

##### `checkBalance(address, fileSizeBytes, epochs, bufferPercent?): Promise<BalanceCheckResult>`
Check if user has enough WAL for storage, calculate SUI needed if not.

##### `ensureWalBalance(fileSizeBytes, epochs, address, signAndExecute, bufferPercent?): Promise<Result>`
Ensure user has enough WAL, automatically swapping SUI if needed.

##### `createSwapSuiToWalTransaction(suiAmount, slippageBps?): Promise<SwapTransactionResult | null>`
Create a swap transaction for wallet signing.

##### `swapSuiToWal(suiAmount, signAndExecute, slippageBps?): Promise<SwapResult>`
Execute a SUI → WAL swap.

### Storage Cost Utilities

```typescript
import { 
  calculateStorageCost,
  calculateStorageCostLive,
  estimateWalNeeded,
  estimateWalNeededLive,
  getWalrusSystemInfo,
  formatWal,
  formatSui 
} from '@lamdanghoang/sui-pay'

// Calculate with default pricing (fast, no RPC)
const cost = calculateStorageCost(fileSize, epochs)
console.log(`Storage: ${cost.totalWal} WAL`)

// Calculate with live on-chain pricing (accurate)
const costLive = await calculateStorageCostLive(fileSize, epochs, 'testnet')
console.log(`Storage: ${costLive.totalWal} WAL (live pricing)`)
console.log(`System info:`, costLive.systemInfo)

// Estimate with buffer (default pricing)
const walNeeded = estimateWalNeeded(fileSize, epochs, 20) // 20% buffer

// Estimate with buffer (live pricing)
const walNeededLive = await estimateWalNeededLive(fileSize, epochs, 'testnet', 20)

// Get system info directly
const systemInfo = await getWalrusSystemInfo('testnet')
console.log(`nShards: ${systemInfo.nShards}`)
console.log(`Storage price: ${systemInfo.storagePricePerUnit} FROST/unit/epoch`)
console.log(`Write price: ${systemInfo.writePricePerUnit} FROST/unit`)

// Format amounts
console.log(formatWal(1000000000n)) // "1.0000"
console.log(formatSui(1000000000n)) // "1.0000"
```

### Pyth Oracle Functions

```typescript
import { getSwapPrices, getSuiUsdPrice, getWalUsdPrice } from '@lamdanghoang/sui-pay'

// Get both prices
const prices = await getSwapPrices()
console.log(`SUI: $${prices.suiUsd}, WAL: $${prices.walUsd}`)
console.log(`Rate: 1 SUI = ${prices.suiWalRate} WAL`)

// Get individual prices
const sui = await getSuiUsdPrice()
const wal = await getWalUsdPrice()
```

## Usage with Different Wallets

### With @mysten/dapp-kit (React)

```typescript
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'

function UploadComponent() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  
  const handleUpload = async () => {
    await client.ensureWalBalance(
      fileSize,
      epochs,
      address,
      signAndExecute
    )
  }
}
```

### With Sui Wallet Standard

```typescript
const signAndExecute = async ({ transaction }) => {
  const result = await wallet.signAndExecuteTransactionBlock({
    transactionBlock: transaction,
  })
  return { digest: result.digest }
}

await client.ensureWalBalance(fileSize, epochs, address, signAndExecute)
```

### With zkLogin

```typescript
import { signWithZkLogin } from './your-zklogin-utils'

const signAndExecute = async ({ transaction }) => {
  const txBytes = await transaction.build({ client: suiClient })
  const signature = await signWithZkLogin(txBytes, credentials)
  
  const result = await suiClient.executeTransactionBlock({
    transactionBlock: txBytes,
    signature,
  })
  return { digest: result.digest }
}
```

## Contract Deployment

The SDK requires a WAL Exchange contract to be deployed. See the `contracts/` directory for the Move source code.

### Environment Variables

```env
NEXT_PUBLIC_WAL_EXCHANGE_PACKAGE_ID=0x...
NEXT_PUBLIC_WAL_EXCHANGE_OBJECT_ID=0x...
```

## Storage Cost Formula

Walrus uses the following pricing formula:

```
Total = encodedUnits × (writePricePerUnit + storagePricePerUnit × epochs)
```

Where:
- `encodedUnits = ceil(encodedSize / 1 MiB)`
- `encodedSize` is calculated using RedStuff encoding (varies by file size and nShards)
- Prices are fetched from on-chain Walrus system object

### On-Chain System Info

The SDK fetches live pricing from the Walrus system object:

```typescript
import { getWalrusSystemInfo } from '@lamdanghoang/sui-pay'

const systemInfo = await getWalrusSystemInfo('testnet')
console.log({
  nShards: systemInfo.nShards,           // e.g., 1000
  storagePricePerUnit: systemInfo.storagePricePerUnit,  // FROST per MiB per epoch
  writePricePerUnit: systemInfo.writePricePerUnit,      // FROST per MiB
  currentEpoch: systemInfo.currentEpoch,
})
```

### Live vs Default Pricing

```typescript
// Use live on-chain pricing (recommended)
const costLive = await calculateStorageCostLive(fileSize, epochs, 'testnet')

// Use default pricing (faster, no RPC call)
const costDefault = calculateStorageCost(fileSize, epochs)

// Check balance with live pricing
const check = await client.checkBalance(address, fileSize, epochs, 20, true)

// Check balance with default pricing
const checkFast = await client.checkBalance(address, fileSize, epochs, 20, false)
```

## License

MIT
