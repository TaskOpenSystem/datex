'use client';

import { useState, useCallback, useMemo } from 'react';
import { FilterState, CategoryFilter, SortOption, DEFAULT_FILTERS, DataAsset } from '@/types/marketplace';

export interface UseMarketplaceFiltersReturn {
    filters: FilterState;
    setCategory: (id: string, checked: boolean) => void;
    setPriceRange: (min: number, max: number) => void;
    setVerifiedOnly: (value: boolean) => void;
    setSearch: (query: string) => void;
    setSortBy: (sort: SortOption) => void;
    resetFilters: () => void;
    filterAssets: (assets: DataAsset[]) => DataAsset[];
}

export function useMarketplaceFilters(): UseMarketplaceFiltersReturn {
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

    const setCategory = useCallback((id: string, checked: boolean) => {
        setFilters((prev) => ({
            ...prev,
            categories: prev.categories.map((cat) =>
                cat.id === id ? { ...cat, checked } : cat
            ),
        }));
    }, []);

    const setPriceRange = useCallback((min: number, max: number) => {
        setFilters((prev) => ({
            ...prev,
            priceRange: { min, max },
        }));
    }, []);

    const setVerifiedOnly = useCallback((value: boolean) => {
        setFilters((prev) => ({
            ...prev,
            verifiedOnly: value,
        }));
    }, []);

    const setSearch = useCallback((query: string) => {
        setFilters((prev) => ({
            ...prev,
            search: query,
        }));
    }, []);

    const setSortBy = useCallback((sort: SortOption) => {
        setFilters((prev) => ({
            ...prev,
            sortBy: sort,
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    // Client-side filtering - replace with API call later
    const filterAssets = useCallback(
        (assets: DataAsset[]): DataAsset[] => {
            let result = [...assets];

            // Filter by search
            if (filters.search.trim()) {
                const searchLower = filters.search.toLowerCase();
                result = result.filter(
                    (asset) =>
                        asset.title.toLowerCase().includes(searchLower) ||
                        asset.description.toLowerCase().includes(searchLower)
                );
            }

            // Filter by categories
            const activeCategories = filters.categories.filter((c) => c.checked);
            if (activeCategories.length > 0) {
                result = result.filter((asset) =>
                    asset.tags.some((tag) =>
                        activeCategories.some(
                            (cat) =>
                                tag.label.toLowerCase().includes(cat.id.toLowerCase()) ||
                                cat.label.toLowerCase().includes(tag.label.toLowerCase())
                        )
                    )
                );
            }

            // Filter by price range
            result = result.filter(
                (asset) =>
                    asset.price >= filters.priceRange.min &&
                    asset.price <= filters.priceRange.max
            );

            // Filter by verified only
            if (filters.verifiedOnly) {
                result = result.filter((asset) =>
                    asset.tags.some((tag) => tag.type === 'verified')
                );
            }

            // Sort
            switch (filters.sortBy) {
                case 'newest':
                    // Keep original order (assuming newest first)
                    break;
                case 'oldest':
                    result = result.reverse();
                    break;
                case 'price_asc':
                    result = result.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    result = result.sort((a, b) => b.price - a.price);
                    break;
            }

            return result;
        },
        [filters]
    );

    return {
        filters,
        setCategory,
        setPriceRange,
        setVerifiedOnly,
        setSearch,
        setSortBy,
        resetFilters,
        filterAssets,
    };
}
