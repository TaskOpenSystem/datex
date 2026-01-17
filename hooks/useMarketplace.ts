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

      // 1. Get the registry object to find all listing IDs
      const registry = await suiClient.getObject({
        id: registryId,
        options: { showContent: true },
      });

      const content = registry.data?.content as { fields?: { listings?: { fields?: { contents?: Array<{ id?: string }> } } } } | undefined;
      const listingIds: string[] = (content?.fields?.listings?.fields?.contents?.map((item) => item.id).filter((id): id is string => !!id) || []);

      if (listingIds.length === 0) return [];

      // 2. Batch fetch all listing details
      const objects = await suiClient.multiGetObjects({
        ids: listingIds,
        options: { showContent: true },
      });

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

      const priceInMIST = BigInt(Math.floor(input.priceSUI * Number(MIST_PER_SUI)));

      // Build PTB with optimized structure
      const tx = new Transaction();
      
      // Set gas budget based on operation complexity
      tx.setGasBudget(10_000_000); // 0.01 SUI - sufficient for single listing

      // PTB: Create listing and transfer in single atomic transaction
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

      // Transfer listing object to sender
      tx.transferObjects([listing], account.address);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            const effects = result.effects as { created?: Array<{ reference: { objectId: string } }> } | undefined;
            const listingId = effects?.created?.[0]?.reference?.objectId || '';
            onSuccess({ listingId, digest: result.digest });
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

      // PTB: Batch transfer all listings to sender in single operation
      tx.transferObjects(listingResults, account.address);

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

      tx.transferObjects([listing], account.address);

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

      const tx = new Transaction();
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(listing.price)]);

      tx.moveCall({
        target: getMarketplaceTarget('purchase_dataset'),
        arguments: [
          tx.object(listing.id),
          payment,
          tx.object('0x0000000000000000000000000000000000000000000000000000000000000006'),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            const effects = result.effects as { created?: Array<{ reference: { objectId: string } }> } | undefined;
            const receiptId = effects?.created?.[0]?.reference?.objectId || '';
            onSuccess({ receiptId, digest: result.digest });
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

  return useQuery({
    queryKey: ['owned-listings', address, marketplaceConfig.packageId],
    queryFn: async () => {
      if (!address) return [];
      
      // Build type string dynamically to ensure env vars are loaded
      const listingType = `${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::DatasetListing`;
      
      const { data } = await suiClient.getOwnedObjects({
        owner: address,
        filter: { StructType: listingType },
        options: { showContent: true, showType: true },
      });

      return data
        .map((obj) => {
          if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') return null;
          try {
            const fields = obj.data.content.fields as Record<string, unknown>;
            // Parse directly from fields (getOwnedObjects returns fields directly)
            return {
              id: obj.data.objectId || '',
              seller: fields.seller as string,
              price: BigInt(fields.price as string),
              blobId: fields.blob_id as string,
              encryptedObject: fields.encrypted_object as string,
              name: fields.name as string,
              description: fields.description as string,
              previewSize: BigInt(fields.preview_size as string),
              totalSize: BigInt(fields.total_size as string),
            } as DatasetListing;
          } catch {
            return null;
          }
        })
        .filter((listing): listing is DatasetListing => listing !== null);
    },
    enabled: !!address,
    refetchInterval: 5000,
  });
}

export function useListing(listingId: string | undefined) {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      if (!listingId) return null;
      
      const object = await suiClient.getObject({
        id: listingId,
        options: { showContent: true },
      });

      if (
        object.data?.content?.dataType !== 'moveObject' ||
        !object.data.type?.includes('DatasetListing')
      ) {
        return null;
      }

      return parseDatasetListing(object.data.content.fields as Record<string, unknown>);
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
