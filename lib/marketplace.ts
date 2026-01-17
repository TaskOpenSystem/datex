import { marketplaceConfig, MIST_PER_SUI } from '@/config/marketplace';
import { DatasetListing } from '@/types/marketplace';

export function suiToMist(suiAmount: number): bigint {
  return BigInt(Math.floor(suiAmount * Number(MIST_PER_SUI)));
}

export function mistToSui(mistAmount: bigint): number {
  return Number(mistAmount) / Number(MIST_PER_SUI);
}

export function formatPrice(mistAmount: bigint): string {
  const sui = mistToSui(mistAmount);
  if (sui >= 1) {
    return `${sui.toFixed(2)} SUI`;
  }
  const mist = Number(mistAmount);
  return `${mist.toLocaleString()} MIST`;
}

export function parsePrice(suiString: string): bigint {
  const suiAmount = parseFloat(suiString);
  if (isNaN(suiAmount) || suiAmount <= 0) {
    throw new Error('Invalid price');
  }
  return suiToMist(suiAmount);
}

export function formatSize(bytes: bigint | number): string {
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (numBytes < 1024) return `${numBytes} B`;
  if (numBytes < 1024 * 1024) return `${(numBytes / 1024).toFixed(1)} KB`;
  if (numBytes < 1024 * 1024 * 1024) return `${(numBytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(numBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function parseSize(sizeString: string): number {
  const match = sizeString.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
  if (!match) throw new Error('Invalid size format');
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  
  switch (unit) {
    case 'B': return Math.floor(value);
    case 'KB': return Math.floor(value * 1024);
    case 'MB': return Math.floor(value * 1024 * 1024);
    case 'GB': return Math.floor(value * 1024 * 1024 * 1024);
    default: return Math.floor(value);
  }
}

export function stringToVectorU8(str: string): number[] {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(str));
}

export function vectorU8ToString(arr: number[] | Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(arr));
}

export function hexToBytes(hex: string): number[] {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

export function bytesToHex(bytes: number[] | Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function textToHex(text: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  return bytesToHex(bytes);
}

export function hexToText(hex: string): string {
  const bytes = hexToBytes(hex);
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

export function parseDatasetListing(
  objectData: Record<string, unknown>
): DatasetListing {
  const fields = objectData.fields as Record<string, unknown>;
  
  return {
    id: (fields.id as Record<string, string>).id,
    seller: fields.seller as string,
    price: BigInt(fields.price as string),
    blobId: vectorU8ToString(fields.blob_id as number[]),
    encryptedObject: fields.encrypted_object as string,
    name: vectorU8ToString(fields.name as number[]),
    description: vectorU8ToString(fields.description as number[]),
    previewSize: BigInt(fields.preview_size as string),
    totalSize: BigInt(fields.total_size as string),
  };
}

export function getMarketplaceTarget(functionName: string): string {
  return `${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::${functionName}`;
}

/**
 * PTB Helper: Estimate gas budget for batch operations
 * @param operationCount Number of operations in the batch
 * @param baseGas Base gas per operation (default: 10M MIST)
 * @param additionalGas Additional gas per extra operation (default: 5M MIST)
 */
export function estimateBatchGasBudget(
  operationCount: number,
  baseGas: number = 10_000_000,
  additionalGas: number = 5_000_000
): number {
  if (operationCount <= 0) return baseGas;
  return baseGas + (operationCount - 1) * additionalGas;
}

/**
 * PTB Helper: Validate inputs before batch transaction
 */
export function validateBatchInputs<T>(
  inputs: T[],
  validator: (input: T) => string | null
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (let i = 0; i < inputs.length; i++) {
    const error = validator(inputs[i]);
    if (error) {
      errors.push(`Item ${i + 1}: ${error}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
