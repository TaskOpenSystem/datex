export interface DataAsset {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  tags: AssetTag[];
  badge?: 'SALE' | 'UPDATED' | 'NEW';
  updatedAt?: string;
  storageSize?: string;
  qualityScore?: number;
  formats?: string[];
  fullDescription?: string;
  features?: string[];
  publisher?: {
    name: string;
    initials: string;
    verified: boolean;
  };
  versionHistory?: {
    version: string;
    date: string;
    isCurrent?: boolean;
  }[];
  reviews?: {
    id: string;
    user: string;
    avatar?: string;
    initials?: string;
    rating: number;
    date: string;
    comment: string;
    bgColor?: string;
  }[];
}

export interface AssetTag {
  label: string;
  icon: string;
  type: 'verified' | 'walrus' | 'default';
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  iconBg: string;
  colorClass: string;
}

export interface MyListing {
  id: string;
  title: string;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  updatedAt: string;
  price: number;
  earnings: number;
  sales: number;
  imageUrl: string;
}

export interface Purchase {
  id: string;
  title: string;
  date: string;
  iconBg: string;
}

// From landing branch
export type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export interface CategoryFilter {
  id: string;
  label: string;
  checked: boolean;
}

export interface FilterState {
  categories: CategoryFilter[];
  priceRange: { min: number; max: number };
  verifiedOnly: boolean;
  search: string;
  sortBy: SortOption;
}

export const DEFAULT_CATEGORIES: CategoryFilter[] = [
  { id: 'defi', label: 'Finance (DeFi)', checked: false },
  { id: 'social', label: 'Social Graph', checked: false },
  { id: 'healthcare', label: 'Healthcare', checked: false },
  { id: 'gaming', label: 'Gaming', checked: false },
];

export const DEFAULT_FILTERS: FilterState = {
  categories: DEFAULT_CATEGORIES,
  priceRange: { min: 0, max: 1000 },
  verifiedOnly: false,
  search: '',
  sortBy: 'newest',
};

// From main branch
export interface DatasetListing {
  id: string;
  seller: string;
  price: bigint;
  blobId: string;
  encryptedObject: string;
  name: string;
  description: string;
  previewSize: bigint;
  totalSize: bigint;
  imageUrl?: string;
  isActive?: boolean;
  mimeType?: string;
  fileName?: string;
  contentType?: string;
  fileCount?: number;
}

export interface PurchaseReceipt {
  id: string;
  datasetId: string;
  buyer: string;
  seller: string;
  price: bigint;
  timestamp: bigint;
}

export interface CreateListingInput {
  name: string;
  description: string;
  priceSUI: number;
  blobId: string;
  encryptedObject: string;
  previewSizeBytes: number;
  totalSizeBytes: number;
  imageUrl: string;
  mimeType: string;
  fileName: string;
  contentType: string;
  fileCount: number;
}

export interface CreateListingResult {
  listingId: string;
  digest: string;
}

export interface BatchCreateListingResult {
  listings: CreateListingResult[];
  totalGasUsed?: bigint;
}

export interface PurchaseResult {
  receiptId: string;
  digest: string;
}

export interface MarketplaceEvents {
  DatasetListed: {
    dataset_id: string;
    seller: string;
    price: string;
    name: string[];
  };
  DatasetPurchased: {
    dataset_id: string;
    buyer: string;
    seller: string;
    price: string;
  };
}
