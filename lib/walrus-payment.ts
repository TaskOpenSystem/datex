// Walrus Payment utilities - standalone functions for server-side or non-hook usage
import {
  WalrusSuiPay,
  calculateStorageCost,
  calculateStorageCostLive,
  estimateWalNeeded,
  estimateWalNeededLive,
  getWalrusSystemInfo,
  getSwapPrices,
  getSuiUsdPrice,
  getWalUsdPrice,
  formatWal,
  formatSui,
} from '@lamdanghoang/sui-pay-wal';
import { walrusConfig } from '@/config/walrus';

// Re-export utilities
export {
  calculateStorageCost,
  calculateStorageCostLive,
  estimateWalNeeded,
  estimateWalNeededLive,
  getWalrusSystemInfo,
  getSwapPrices,
  getSuiUsdPrice,
  getWalUsdPrice,
  formatWal,
  formatSui,
};

// Create a singleton client instance
let clientInstance: WalrusSuiPay | null = null;

export function getWalrusSuiPayClient(): WalrusSuiPay | null {
  if (!walrusConfig.exchangePackageId || !walrusConfig.exchangeObjectId) {
    console.warn('WAL Exchange contract not configured. Set NEXT_PUBLIC_WAL_EXCHANGE_PACKAGE_ID and NEXT_PUBLIC_WAL_EXCHANGE_OBJECT_ID');
    return null;
  }

  if (!clientInstance) {
    clientInstance = new WalrusSuiPay({
      network: walrusConfig.network,
      exchangePackageId: walrusConfig.exchangePackageId,
      exchangeObjectId: walrusConfig.exchangeObjectId,
    });
  }

  return clientInstance;
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper to calculate and format storage cost summary
export async function getStorageCostSummary(fileSizeBytes: number, epochs: number = 3) {
  const cost = calculateStorageCost(fileSizeBytes, epochs);
  
  let prices = null;
  try {
    prices = await getSwapPrices();
  } catch {
    // Prices unavailable
  }

  return {
    fileSize: formatFileSize(fileSizeBytes),
    epochs,
    walCost: cost.totalWal,
    walCostRaw: cost.totalCostFrost,
    storageUnits: cost.storageUnits,
    usdEstimate: prices ? (Number(cost.totalCostFrost) / 1e9 * prices.walUsd).toFixed(4) : null,
  };
}