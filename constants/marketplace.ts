import { DataAsset, Collection, MyListing, Purchase } from '@/types/marketplace';

export const COLLECTIONS: Collection[] = [
  {
    id: '1',
    title: 'Top Sui Movers',
    subtitle: 'High volume trading data from top DEXs.',
    badge: 'TRENDING',
    iconBg: 'trending_up',
    colorClass: 'bg-accent-lime',
  },
  {
    id: '2',
    title: 'NFT Metadata',
    subtitle: 'Rarity scores and historical floor prices.',
    badge: 'HOT',
    iconBg: 'image',
    colorClass: 'bg-accent-orange',
  },
  {
    id: '3',
    title: 'DeFi Liquidity',
    subtitle: 'Real-time pool depth analysis.',
    badge: 'NEW',
    iconBg: 'water_drop',
    colorClass: 'bg-primary',
  },
];

export const DATA_ASSETS: DataAsset[] = [
  {
    id: '101',
    title: 'Global E-commerce Trends Q3',
    description: 'Aggregated consumer behavior data across major platforms.',
    price: 50,
    currency: 'SUI',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
    tags: [{ label: 'Finance', icon: '', type: 'default' }, { label: 'Seal Verified', icon: 'verified', type: 'verified' }],
    badge: 'UPDATED',
    updatedAt: '2 hours ago',
    storageSize: '2.4 GB',
    qualityScore: 98,
    formats: ['JSON', 'CSV'],
    fullDescription: 'This dataset provides a comprehensive aggregation of consumer behavior across major decentralized and centralized e-commerce platforms for Q3 2024. It includes granular data points on purchasing habits, cart abandonment rates, and payment method preferences with a focus on crypto-native checkout solutions.\n\nData is collected via verified oracle nodes and stored immutably on the Walrus protocol, ensuring high integrity and resistance to tampering.',
    features: [
      '5M+ Unique Transaction Records',
      'Cross-chain analysis (Sui, Solana, Ethereum)',
      'Real-time sentiment mapping',
      'GDPR & CCPA Compliant Anonymization'
    ],
    publisher: { name: 'DataTrekker DAO', initials: 'DT', verified: true },
    versionHistory: [
      { version: 'v1.2', date: 'Oct 12, 2024', isCurrent: true },
      { version: 'v1.1', date: 'Sep 28, 2024' },
      { version: 'v1.0', date: 'Sep 15, 2024' }
    ],
    reviews: [
      { id: 'r1', user: 'CryptoWhale_99', rating: 5, date: '2 days ago', comment: 'Extremely high quality data. The JSON formatting is clean and required zero cleanup before ingestion into our analytics pipeline. Worth every SUI.' },
      { id: 'r2', user: 'AlphaLab Research', initials: 'AL', rating: 4.5, date: '5 days ago', comment: 'Solid dataset. The consumer behavior section is particularly detailed.', bgColor: 'bg-primary' }
    ]
  },
  {
    id: '102',
    title: 'Sui Validator Performance',
    description: 'Historical uptime and reward distribution metrics for all nodes.',
    price: 12,
    currency: 'SUI',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=60',
    tags: [{ label: 'Walrus', icon: 'cloud', type: 'walrus' }],
  },
  {
    id: '103',
    title: 'Social Sentiment: Move Lang',
    description: 'Twitter and Discord sentiment analysis for Move programming language.',
    price: 100,
    currency: 'SUI',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60',
    tags: [{ label: 'Seal Verified', icon: 'verified', type: 'verified' }],
  },
  {
    id: '104',
    title: 'Web3 Gaming User Churn',
    description: 'Deep dive into player retention across top 50 blockchain games.',
    price: 75,
    currency: 'SUI',
    imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0e?w=800&auto=format&fit=crop&q=60',
    tags: [{ label: 'Walrus', icon: 'cloud', type: 'walrus' }],
  },
  {
    id: '105',
    title: 'APac Climate Data 2024',
    description: 'High fidelity weather station reports for agricultural use.',
    price: 200,
    currency: 'SUI',
    imageUrl: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&auto=format&fit=crop&q=60',
    tags: [{ label: 'Seal Verified', icon: 'verified', type: 'verified' }],
    badge: 'SALE',
  },
];

export const MY_LISTINGS: MyListing[] = [
  {
    id: '101',
    title: 'Global E-commerce Trends Q3',
    status: 'ACTIVE',
    updatedAt: 'Updated 2 days ago',
    price: 50,
    earnings: 1200,
    sales: 24,
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: '102',
    title: 'Sui Validator Performance',
    status: 'ACTIVE',
    updatedAt: 'Updated 1 week ago',
    price: 12,
    earnings: 48,
    sales: 4,
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: '104',
    title: 'Web3 Gaming User Churn',
    status: 'PAUSED',
    updatedAt: 'Updated 1 month ago',
    price: 75,
    earnings: 225,
    sales: 3,
    imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0e?w=800&auto=format&fit=crop&q=60',
  },
];

export const MY_PURCHASES: Purchase[] = [
  {
    id: 'p1',
    title: 'DeFi Liquidity Pools V2',
    date: 'Purchased on Oct 24, 2024',
    iconBg: 'pie_chart'
  }
];
