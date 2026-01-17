'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useMarketplaceFilters, UseMarketplaceFiltersReturn } from '@/hooks/useMarketplaceFilters';

const MarketplaceFilterContext = createContext<UseMarketplaceFiltersReturn | null>(null);

export function MarketplaceFilterProvider({ children }: { children: ReactNode }) {
    const filterState = useMarketplaceFilters();

    return (
        <MarketplaceFilterContext.Provider value={filterState}>
            {children}
        </MarketplaceFilterContext.Provider>
    );
}

export function useMarketplaceFilterContext() {
    const context = useContext(MarketplaceFilterContext);
    if (!context) {
        throw new Error('useMarketplaceFilterContext must be used within MarketplaceFilterProvider');
    }
    return context;
}
