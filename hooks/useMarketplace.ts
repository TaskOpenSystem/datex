'use client';

import { useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery } from '@tanstack/react-query';
import { marketplaceConfig, MIST_PER_SUI } from '@/config/marketplace';
import {
  CreateListingInput,
  CreateListingResult,
  DatasetListing,
  PurchaseResult
} from '@/types/marketplace';
import {
  getMarketplaceTarget,
  parseDatasetListing
} from '@/lib/marketplace';

const LISTING_TYPE = `${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::DatasetListing`;
const REGISTRY_TYPE = `${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::DatasetRegistry`;

// For shared objects, we know the Registry ID from the contract deployment
export function useRegistry() {
  return useQuery({
    queryKey: ['registry'],
    queryFn: async () => {
      return marketplaceConfig.registryId;
    },
  });
}

export function useAllListings() {
  const suiClient = useSuiClient();
  const { data: registryId } = useRegistry();

  return useQuery({
    queryKey: ['all-listings', registryId],
    queryFn: async () => {
      if (!registryId) return [];

      console.log('[useAllListings] Fetching registry:', registryId);

      // 1. Get the registry object to find all listing IDs
      const registry = await suiClient.getObject({
        id: registryId,
        options: { showContent: true },
      });

      console.log('[useAllListings] Registry data:', registry.data);

      // VecSet<ID> stores IDs as an array of strings directly
      const content = registry.data?.content as { fields?: { listings?: { fields?: { contents?: string[] } } } } | undefined;
      const listingIds: string[] = (content?.fields?.listings?.fields?.contents || []).filter((id): id is string => !!id && id.startsWith('0x'));

      console.log('[useAllListings] Found listings:', listingIds.length, listingIds);

      if (listingIds.length === 0) return [];

      // 2. Batch fetch all listing details
      const objects = await suiClient.multiGetObjects({
        ids: listingIds,
        options: { showContent: true },
      });

      console.log('[useAllListings] Fetched objects:', objects.length);

      return objects
        .map((obj) => {
          const fields = obj.data?.content?.dataType === 'moveObject' ? (obj.data.content.fields as Record<string, unknown>) : null;
          if (!fields) return null;

          return {
            id: obj.data?.objectId || '',
            seller: fields.seller as string,
            price: BigInt(fields.price as string),
            blobId: fields.blob_id as string,
            encryptedObject: fields.encrypted_object as string,
            name: fields.name as string,
            description: fields.description as string,
            previewSize: BigInt(fields.preview_size as string),
            totalSize: BigInt(fields.total_size as string),
          } as DatasetListing;
        })
        .filter((listing): listing is DatasetListing => listing !== null);
    },
    enabled: !!registryId,
    refetchInterval: 30000,
  });
}

/**
 * PTB-optimized hook for creating dataset listings
 * Uses Programmable Transaction Blocks for efficient on-chain operations
 */
export function useListDataset() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending, error } = useSignAndExecuteTransaction();
  const { data: registryId } = useRegistry();

  /**
   * Create a single listing using PTB
   * Optimized with proper gas budget estimation
   */
  const createListing = useCallback(
    (input: CreateListingInput, onSuccess: (result: CreateListingResult) => void) => {
      if (!account) {
        throw new Error('Wallet not connected');
      }
      if (!registryId) {
        throw new Error('Registry not found');
      }

      console.log('=== CREATE LISTING START ===');
      console.log('Input:', input);
      console.log('Registry ID:', registryId);
      console.log('Account:', account.address);

      const priceInMIST = BigInt(Math.floor(input.priceSUI * Number(MIST_PER_SUI)));
      console.log('Price in MIST:', priceInMIST.toString());

      // Build PTB with optimized structure
      const tx = new Transaction();

      // Set gas budget based on operation complexity
      tx.setGasBudget(10_000_000); // 0.01 SUI - sufficient for single listing

      // PTB: Create listing and transfer in single atomic transaction
      console.log('Creating list_dataset moveCall...');
      const listing = tx.moveCall({
        target: getMarketplaceTarget('list_dataset'),
        arguments: [
          tx.object(registryId),
          tx.pure.string(input.blobId),
          tx.pure.string(input.encryptedObject),
          tx.pure.string(input.name),
          tx.pure.string(input.description),
          tx.pure.u64(priceInMIST),
          tx.pure.u64(input.previewSizeBytes),
          tx.pure.u64(input.totalSizeBytes),
        ],
      });
      console.log('list_dataset moveCall created, listing result:', listing);

      // Share listing object publicly so anyone can purchase
      console.log('Creating public_share_object moveCall...');
      console.log('Type argument:', `${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::DatasetListing`);
      tx.moveCall({
        target: '0x2::transfer::public_share_object',
        typeArguments: [`${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::DatasetListing`],
        arguments: [listing],
      });
      console.log('public_share_object moveCall added to transaction');

      console.log('Executing transaction...');
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('=== CREATE LISTING SUCCESS ===');
            console.log('Transaction result:', result);
            console.log('Digest:', result.digest);
            console.log('Effects:', result.effects);
            const effects = result.effects as { created?: Array<{ reference: { objectId: string } }> } | undefined;
            const listingId = effects?.created?.[0]?.reference?.objectId || '';
            console.log('Created listing ID:', listingId);
            onSuccess({ listingId, digest: result.digest });
          },
          onError: (error) => {
            console.error('=== CREATE LISTING ERROR ===');
            console.error('Error:', error);
          },
        }
      );
    },
    [account, registryId, signAndExecute]
  );

  /**
   * PTB Batch: Create multiple listings in a single transaction
   * Significantly reduces gas costs when listing multiple datasets
   */
  const createBatchListings = useCallback(
    (
      inputs: CreateListingInput[],
      onSuccess: (results: CreateListingResult[]) => void
    ) => {
      if (!account) {
        throw new Error('Wallet not connected');
      }
      if (!registryId) {
        throw new Error('Registry not found');
      }
      if (inputs.length === 0) {
        throw new Error('No listings to create');
      }

      const tx = new Transaction();

      // Dynamic gas budget based on number of listings
      // Base: 10M MIST + 5M per additional listing
      const gasBudget = 10_000_000 + (inputs.length - 1) * 5_000_000;
      tx.setGasBudget(gasBudget);

      const listingResults: ReturnType<typeof tx.moveCall>[] = [];

      // PTB: Batch all listing creations
      for (const input of inputs) {
        const priceInMIST = BigInt(Math.floor(input.priceSUI * Number(MIST_PER_SUI)));

        const listing = tx.moveCall({
          target: getMarketplaceTarget('list_dataset'),
          arguments: [
            tx.object(registryId),
            tx.pure.string(input.blobId),
            tx.pure.string(input.encryptedObject),
            tx.pure.string(input.name),
            tx.pure.string(input.description),
            tx.pure.u64(priceInMIST),
            tx.pure.u64(input.previewSizeBytes),
            tx.pure.u64(input.totalSizeBytes),
          ],
        });

        listingResults.push(listing);
      }

      // PTB: Batch share all listings publicly
      for (const listing of listingResults) {
        tx.moveCall({
          target: '0x2::transfer::public_share_object',
          typeArguments: [`${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::DatasetListing`],
          arguments: [listing],
        });
      }

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            const effects = result.effects as { created?: Array<{ reference: { objectId: string } }> } | undefined;
            const createdIds = effects?.created?.map((obj) => obj.reference.objectId) || [];

            const results: CreateListingResult[] = createdIds.map((id) => ({
              listingId: id,
              digest: result.digest,
            }));

            onSuccess(results);
          },
        }
      );
    },
    [account, registryId, signAndExecute]
  );

  /**
   * Build a PTB transaction without executing (for inspection/dry-run)
   */
  const buildListingTransaction = useCallback(
    (input: CreateListingInput): Transaction | null => {
      if (!account || !registryId) return null;

      const priceInMIST = BigInt(Math.floor(input.priceSUI * Number(MIST_PER_SUI)));

      const tx = new Transaction();
      tx.setGasBudget(10_000_000);

      const listing = tx.moveCall({
        target: getMarketplaceTarget('list_dataset'),
        arguments: [
          tx.object(registryId),
          tx.pure.string(input.blobId),
          tx.pure.string(input.encryptedObject),
          tx.pure.string(input.name),
          tx.pure.string(input.description),
          tx.pure.u64(priceInMIST),
          tx.pure.u64(input.previewSizeBytes),
          tx.pure.u64(input.totalSizeBytes),
        ],
      });

      tx.moveCall({
        target: '0x2::transfer::public_share_object',
        typeArguments: [`${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::DatasetListing`],
        arguments: [listing],
      });

      return tx;
    },
    [account, registryId]
  );

  return {
    createListing,
    createBatchListings,
    buildListingTransaction,
    isPending,
    error,
  };
}

export function usePurchaseDataset() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending, error } = useSignAndExecuteTransaction();

  const purchase = useCallback(
    (
      listing: DatasetListing,
      onSuccess: (result: PurchaseResult) => void
    ) => {
      if (!account) {
        throw new Error('Wallet not connected');
      }

      console.log('=== PURCHASE DATASET ===');
      console.log('Listing:', listing);
      console.log('Buyer:', account.address);

      const tx = new Transaction();
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(listing.price)]);

      // Call purchase_dataset and get the PurchaseReceipt
      const receipt = tx.moveCall({
        target: getMarketplaceTarget('purchase_dataset'),
        arguments: [
          tx.object(listing.id),
          payment,
          tx.object('0x0000000000000000000000000000000000000000000000000000000000000006'),
        ],
      });
      console.log('purchase_dataset moveCall created');

      // Transfer PurchaseReceipt to buyer
      tx.transferObjects([receipt], account.address);
      console.log('transferObjects receipt to buyer added');

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('=== PURCHASE SUCCESS ===');
            console.log('Result:', result);
            const effects = result.effects as { created?: Array<{ reference: { objectId: string } }> } | undefined;
            const receiptId = effects?.created?.[0]?.reference?.objectId || '';
            console.log('Receipt ID:', receiptId);
            onSuccess({ receiptId, digest: result.digest });
          },
          onError: (error) => {
            console.error('=== PURCHASE ERROR ===');
            console.error('Error:', error);
          },
        }
      );
    },
    [account, signAndExecute]
  );

  return {
    purchase,
    isPending,
    error,
  };
}

export function useOwnedListings(address?: string) {
  const suiClient = useSuiClient();
  const { data: registryId } = useRegistry();

  return useQuery({
    queryKey: ['owned-listings', address, registryId],
    queryFn: async () => {
      if (!address || !registryId) return [];

      console.log('[useOwnedListings] Fetching listings for seller:', address);

      // 1. Get the registry object to find all listing IDs
      const registry = await suiClient.getObject({
        id: registryId,
        options: { showContent: true },
      });

      // VecSet<ID> stores IDs as an array of strings directly
      const content = registry.data?.content as { fields?: { listings?: { fields?: { contents?: string[] } } } } | undefined;
      const listingIds: string[] = (content?.fields?.listings?.fields?.contents || []).filter((id): id is string => !!id && id.startsWith('0x'));

      console.log('[useOwnedListings] Found total listings:', listingIds.length);

      if (listingIds.length === 0) return [];

      // 2. Batch fetch all listing details
      const objects = await suiClient.multiGetObjects({
        ids: listingIds,
        options: { showContent: true },
      });

      // 3. Filter by seller address and parse
      const listings = objects
        .map((obj) => {
          const fields = obj.data?.content?.dataType === 'moveObject' ? (obj.data.content.fields as Record<string, unknown>) : null;
          if (!fields) return null;

          // Only return listings where seller matches the current user
          const seller = fields.seller as string;
          if (seller !== address) return null;

          return {
            id: obj.data?.objectId || '',
            seller: seller,
            price: BigInt(fields.price as string),
            blobId: fields.blob_id as string,
            encryptedObject: fields.encrypted_object as string,
            name: fields.name as string,
            description: fields.description as string,
            previewSize: BigInt(fields.preview_size as string),
            totalSize: BigInt(fields.total_size as string),
          } as DatasetListing;
        })
        .filter((listing): listing is DatasetListing => listing !== null);

      console.log('[useOwnedListings] Listings by seller:', listings.length);

      return listings;
    },
    enabled: !!address && !!registryId,
    refetchInterval: 5000,
  });
}

export function useListing(listingId: string | undefined) {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      if (!listingId) return null;

      console.log('[useListing] Fetching listing:', listingId);

      const object = await suiClient.getObject({
        id: listingId,
        options: { showContent: true, showType: true },
      });

      console.log('[useListing] Object response:', object);

      if (!object.data?.content || object.data.content.dataType !== 'moveObject') {
        console.log('[useListing] Not a move object or no content');
        return null;
      }

      // Check if it's a DatasetListing type
      if (!object.data.type?.includes('DatasetListing')) {
        console.log('[useListing] Not a DatasetListing type:', object.data.type);
        return null;
      }

      const fields = object.data.content.fields as Record<string, unknown>;
      console.log('[useListing] Fields:', fields);

      // Parse directly from fields (same as useOwnedListings and useAllListings)
      try {
        return {
          id: listingId, // Use the passed listingId directly
          seller: fields.seller as string,
          price: BigInt(fields.price as string),
          blobId: fields.blob_id as string,
          encryptedObject: fields.encrypted_object as string,
          name: fields.name as string,
          description: fields.description as string,
          previewSize: BigInt(fields.preview_size as string),
          totalSize: BigInt(fields.total_size as string),
        } as DatasetListing;
      } catch (err) {
        console.error('[useListing] Parse error:', err);
        return null;
      }
    },
    enabled: !!listingId,
  });
}

export function useAccountBalance() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['account-balance', account?.address],
    queryFn: async () => {
      if (!account?.address) return null;

      const balance = await suiClient.getBalance({
        owner: account.address,
        coinType: '0x2::sui::SUI',
      });

      return {
        mist: BigInt(balance.totalBalance),
        sui: Number(balance.totalBalance) / Number(MIST_PER_SUI),
      };
    },
    enabled: !!account?.address,
    refetchInterval: 10000,
  });
}

export function usePurchasedDatasets(address?: string) {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['purchased-datasets', address],
    queryFn: async () => {
      if (!address) return [];

      const RECEIPT_TYPE = `${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::PurchaseReceipt`;

      // Step 1: Get all purchase receipts owned by the user
      const { data } = await suiClient.getOwnedObjects({
        owner: address,
        filter: { StructType: RECEIPT_TYPE },
        options: { showContent: true, showType: true },
      });

      const receipts = data
        .map((obj) => {
          if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') return null;
          const fields = obj.data.content.fields as Record<string, unknown>;
          return {
            id: obj.data.objectId || '',
            datasetId: fields.dataset_id as string,
            buyer: fields.buyer as string,
            seller: fields.seller as string,
            price: BigInt(fields.price as string),
            timestamp: Number(fields.timestamp),
          };
        })
        .filter((receipt): receipt is { id: string; datasetId: string; buyer: string; seller: string; price: bigint; timestamp: number } => receipt !== null);

      if (receipts.length === 0) return [];

      // Step 2: Fetch the dataset details for each purchase receipt
      const datasetIds = receipts.map(r => r.datasetId).filter(id => id && id !== '');

      if (datasetIds.length === 0) return receipts.map(r => ({ ...r, dataset: null }));

      const datasetObjects = await suiClient.multiGetObjects({
        ids: datasetIds,
        options: { showContent: true },
      });

      // Create a map of dataset ID -> dataset details
      const datasetMap = new Map<string, DatasetListing | null>();
      datasetObjects.forEach((obj) => {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = obj.data.content.fields as Record<string, unknown>;
          const dataset: DatasetListing = {
            id: obj.data.objectId || '',
            seller: fields.seller as string,
            price: BigInt(fields.price as string),
            blobId: fields.blob_id as string,
            encryptedObject: fields.encrypted_object as string,
            name: fields.name as string,
            description: fields.description as string,
            previewSize: BigInt(fields.preview_size as string),
            totalSize: BigInt(fields.total_size as string),
          };
          datasetMap.set(obj.data.objectId || '', dataset);
        }
      });

      // Step 3: Combine receipts with dataset details
      return receipts.map(receipt => ({
        ...receipt,
        dataset: datasetMap.get(receipt.datasetId) || null,
      }));
    },
    enabled: !!address,
    refetchInterval: 10000,
  });
}

export function useDownloadDataset() {
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const { data: balance } = useAccountBalance();

  const WALRUS_AGGREGATORS = [
    'https://aggregator.walrus-testnet.walrus.space',
    'https://blob-rpc-testnet.walrus.space',
  ];

  // Helper to fetch from Walrus using HTTP API
  const fetchFromWalrusAndDownload = useCallback(async (blobId: string, onSuccess: (data: Uint8Array) => void, onError: (err: Error) => void) => {
    try {
      console.log('[Walrus] Fetching blob:', blobId);

      // Check if blobId is a hex string (starts with 0x)
      if (blobId.startsWith('0x')) {
        console.log('[Walrus] Hex blobId detected - this is a content hash, not a Walrus blob ID');
        onError(new Error('This listing has incorrect blobId format. The file needs to be re-uploaded to get a valid Walrus blob ID.'));
        return;
      }

      // Try multiple aggregators
      let bytes: Uint8Array | null = null;
      let lastError: Error | null = null;

      for (const aggregator of WALRUS_AGGREGATORS) {
        try {
          console.log('[Walrus] Trying aggregator:', aggregator);
          const response = await fetch(`${aggregator}/v1/blobs/${blobId}`, {
            method: 'GET',
            signal: AbortSignal.timeout(30000),
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            bytes = new Uint8Array(arrayBuffer);
            console.log('[Walrus] Success! Size:', bytes.length);
            break;
          } else if (response.status !== 404) {
            const text = await response.text();
            console.log('[Walrus] Error from aggregator:', response.status, text);
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Connection error');
          console.log('[Walrus] Connection error:', lastError.message);
        }
      }

      if (bytes) {
        onSuccess(bytes);
      } else {
        onError(new Error('Blob not found on any Walrus aggregator. The blob may have expired or been deleted.'));
      }
    } catch (err) {
      console.error('[Walrus] Error:', err);
      onError(err instanceof Error ? err : new Error('Failed to fetch from Walrus'));
    }
  }, []);

  const download = useCallback(
    async (
      listing: DatasetListing,
      buyerAddress: string,
      txDigest: string,
      onSuccess: (data: Uint8Array) => void,
      onError: (error: Error) => void
    ) => {
      try {
        // Try enclave first
        const response = await fetch(`${marketplaceConfig.enclaveUrl}/process_data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: {
              dataset_id: listing.id,
              blob_id: listing.blobId,
              payment_tx_digest: txDigest,
              buyer_address: buyerAddress,
            },
          }),
        });

        if (!response.ok) {
          // Fallback to direct Walrus
          console.log('[Download] Enclave failed, trying Walrus...');
          await fetchFromWalrusAndDownload(listing.blobId, onSuccess, onError);
          return;
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        const dataStr = result.data?.decrypted_data || result.data;
        if (dataStr) {
          const binaryStr = atob(dataStr);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          onSuccess(bytes);
        } else {
          throw new Error('No data returned');
        }
      } catch (err) {
        onError(err instanceof Error ? err : new Error('Download failed'));
      }
    },
    [fetchFromWalrusAndDownload]
  );

  const downloadFile = useCallback(
    async (
      listing: DatasetListing,
      buyerAddress: string,
      txDigest: string,
      filename: string
    ) => {
      return new Promise<boolean>((resolve, reject) => {
        download(
          listing,
          buyerAddress,
          txDigest,
          (data) => {
            const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            const blob = new Blob([arrayBuffer as ArrayBuffer], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            resolve(true);
          },
          (err) => {
            reject(err);
          }
        );
      });
    },
    [download]
  );

  return {
    download,
    downloadFile,
    isPending,
    balance,
  };
}
