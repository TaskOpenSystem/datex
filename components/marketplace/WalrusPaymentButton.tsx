'use client';

import { useState } from 'react';
import { useWalrusPayment } from '@/hooks/useWalrusPayment';

interface WalrusPaymentButtonProps {
  fileSizeBytes: number;
  epochs?: number;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
  className?: string;
}

export function WalrusPaymentButton({
  fileSizeBytes,
  epochs = 3,
  onPaymentSuccess,
  onPaymentError,
  className = '',
}: WalrusPaymentButtonProps) {
  const {
    isLoading,
    error,
    isInitialized,
    address,
    getStorageCost,
    checkBalance,
    ensureWalBalance,
    formatWal,
    formatSui,
  } = useWalrusPayment();

  const [balanceStatus, setBalanceStatus] = useState<{
    sufficient: boolean;
    walNeeded: bigint;
    suiNeeded: bigint;
  } | null>(null);

  const storageCost = getStorageCost(fileSizeBytes, epochs);

  const handleCheckBalance = async () => {
    const status = await checkBalance(fileSizeBytes, epochs);
    if (status) {
      setBalanceStatus({
        sufficient: status.sufficient,
        walNeeded: status.walNeeded,
        suiNeeded: status.suiNeeded ?? BigInt(0),
      });
    }
  };

  const handleEnsureBalance = async () => {
    const result = await ensureWalBalance(fileSizeBytes, epochs);
    if (result.success) {
      onPaymentSuccess?.();
    } else {
      onPaymentError?.(result.error || 'Payment failed');
    }
  };

  if (!isInitialized) {
    return (
      <div className="text-yellow-500 text-sm">
        WAL Exchange not configured. Please set environment variables.
      </div>
    );
  }

  if (!address) {
    return (
      <div className="text-gray-500 text-sm">
        Connect wallet to continue
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Storage Cost Display */}
      <div className="bg-gray-800 rounded-lg p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Storage Cost:</span>
          <span className="text-white font-medium">{storageCost.totalWal} WAL</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Duration: {epochs} epochs</span>
          <span>Units: {storageCost.storageUnits}</span>
        </div>
      </div>

      {/* Balance Status */}
      {balanceStatus && (
        <div className={`rounded-lg p-3 text-sm ${balanceStatus.sufficient ? 'bg-green-900/30' : 'bg-yellow-900/30'}`}>
          {balanceStatus.sufficient ? (
            <span className="text-green-400">✓ Sufficient WAL balance</span>
          ) : (
            <div className="space-y-1">
              <span className="text-yellow-400">Need to swap SUI for WAL</span>
              <div className="text-xs text-gray-400">
                WAL needed: {formatWal(balanceStatus.walNeeded)} | 
                SUI required: {formatSui(balanceStatus.suiNeeded)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 rounded p-2">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCheckBalance}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Check Balance'}
        </button>
        
        <button
          onClick={handleEnsureBalance}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Pay & Continue'}
        </button>
      </div>
    </div>
  );
}
