'use client';

import { useState, useCallback, useMemo } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {
  WalrusSuiPay,
  calculateStorageCost,
  calculateStorageCostLive,
  estimateWalNeeded,
  getSwapPrices,
  formatWal,
  formatSui,
  type StorageCost,
  type SwapPrices,
  type BalanceCheckResult,
} from '@lamdanghoang/sui-pay-wal';
import { walrusConfig } from '@/config/walrus';

export function useWalrusPayment() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize WalrusSuiPay client
  const client = useMemo(() => {
    if (!walrusConfig.exchangePackageId || !walrusConfig.exchangeObjectId) {
      return null;
    }
    return new WalrusSuiPay({
      network: walrusConfig.network,
      exchangePackageId: walrusConfig.exchangePackageId,
      exchangeObjectId: walrusConfig.exchangeObjectId,
    });
  }, []);

  // Calculate storage cost (offline, fast)
  const getStorageCost = useCallback((fileSizeBytes: number, epochs: number = walrusConfig.defaultEpochs): StorageCost => {
    return calculateStorageCost(fileSizeBytes, epochs);
  }, []);

  // Calculate storage cost with live on-chain pricing
  const getStorageCostLive = useCallback(async (fileSizeBytes: number, epochs: number = walrusConfig.defaultEpochs) => {
    setIsLoading(true);
    setError(null);
    try {
      const cost = await calculateStorageCostLive(fileSizeBytes, epochs, walrusConfig.network);
      return cost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get live storage cost');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Estimate WAL needed with buffer
  const estimateWal = useCallback((fileSizeBytes: number, epochs: number = walrusConfig.defaultEpochs, bufferPercent: number = walrusConfig.defaultBufferPercent): bigint => {
    return estimateWalNeeded(fileSizeBytes, epochs, bufferPercent);
  }, []);

  // Get current swap prices from Pyth Oracle
  const getPrices = useCallback(async (): Promise<SwapPrices | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const prices = await getSwapPrices();
      return prices;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get swap prices');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user has enough WAL balance
  const checkBalance = useCallback(async (
    fileSizeBytes: number,
    epochs: number = walrusConfig.defaultEpochs,
    bufferPercent: number = walrusConfig.defaultBufferPercent
  ): Promise<BalanceCheckResult | null> => {
    if (!client || !account?.address) {
      setError('Client not initialized or wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await client.checkBalance(
        account.address,
        fileSizeBytes,
        epochs,
        bufferPercent
      );
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check balance');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, account?.address]);

  // Ensure user has enough WAL (auto-swap if needed)
  const ensureWalBalance = useCallback(async (
    fileSizeBytes: number,
    epochs: number = walrusConfig.defaultEpochs,
    bufferPercent: number = walrusConfig.defaultBufferPercent
  ) => {
    if (!client || !account?.address) {
      setError('Client not initialized or wallet not connected');
      return { success: false, walBalance: BigInt(0), error: 'Not initialized' };
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await client.ensureWalBalance(
        fileSizeBytes,
        epochs,
        account.address,
        signAndExecute,
        bufferPercent
      );
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to ensure WAL balance';
      setError(errorMsg);
      return { success: false, walBalance: BigInt(0), error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [client, account?.address, signAndExecute]);

  // Swap SUI to WAL directly
  const swapSuiToWal = useCallback(async (suiAmount: bigint, slippageBps: number = 100) => {
    if (!client || !account?.address) {
      setError('Client not initialized or wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await client.swapSuiToWal(suiAmount, signAndExecute, slippageBps);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to swap SUI to WAL');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, account?.address, signAndExecute]);

  // Get WAL balance
  const getWalBalance = useCallback(async (): Promise<bigint | null> => {
    if (!client || !account?.address) return null;
    try {
      return await client.getWalBalance(account.address);
    } catch {
      return null;
    }
  }, [client, account?.address]);

  // Get SUI balance
  const getSuiBalance = useCallback(async (): Promise<bigint | null> => {
    if (!client || !account?.address) return null;
    try {
      return await client.getSuiBalance(account.address);
    } catch {
      return null;
    }
  }, [client, account?.address]);

  return {
    // State
    isLoading,
    error,
    isInitialized: !!client,
    address: account?.address,

    // Cost estimation
    getStorageCost,
    getStorageCostLive,
    estimateWal,

    // Pricing
    getPrices,

    // Balance operations
    checkBalance,
    ensureWalBalance,
    getWalBalance,
    getSuiBalance,

    // Swap
    swapSuiToWal,

    // Utilities
    formatWal,
    formatSui,
  };
}
