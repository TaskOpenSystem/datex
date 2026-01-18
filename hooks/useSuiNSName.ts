"use client";

import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

const SUINS_REGISTRY_TABLE_ID =
  "0xe64cd9db9f829c6cc405d9790bd71567ae07259855f4f60e586da9711c55a06d";

/**
 * Hook to resolve a Sui address to its SuiNS name
 * Returns the .sui name if found, otherwise returns null
 */
export function useSuiNSName(address: string | undefined) {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ["suins-name", address],
    queryFn: async () => {
      if (!address) return null;

      try {
        // Use resolveNameServiceNames from SuiClient
        const { data } = await suiClient.resolveNameServiceNames({
          address,
          limit: 1,
        });

        if (data && data.length > 0) {
          return data[0]; // Returns the primary SuiNS name (e.g., "alice.sui")
        }

        return null;
      } catch (error) {
        console.error("[useSuiNSName] Error resolving name:", error);
        return null;
      }
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Hook to resolve a SuiNS name to its address
 */
export function useSuiNSAddress(name: string | undefined) {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ["suins-address", name],
    queryFn: async () => {
      if (!name) return null;

      try {
        const address = await suiClient.resolveNameServiceAddress({
          name,
        });

        return address;
      } catch (error) {
        console.error("[useSuiNSAddress] Error resolving address:", error);
        return null;
      }
    },
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
