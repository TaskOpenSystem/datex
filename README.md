# Datex - Decentralized Data Exchange on Sui

<div align="center">

**A decentralized data marketplace built on the Sui blockchain, featuring encrypted data storage via Walrus, Seal encryption, and Nautilus TEE for secure data preview and trading.**

[Live Demo](https://datex.vercel.app) · [Documentation](#-documentation) · [Report Bug](https://github.com/Vietnam-Sui-Builders/datex/issues)

</div>

---

## 🎯 Project Overview

Datex is a decentralized marketplace for buying and selling datasets on the Sui blockchain. The platform enables:

- **Sellers**: Upload and encrypt datasets using Seal Protocol, store on Walrus decentralized storage, and manage listings via Sui smart contracts
- **Buyers**: Preview partial data through Nautilus TEE (Trusted Execution Environment) before purchase, ensuring data quality verification without exposing the full dataset

### Key Innovation

Unlike traditional data marketplaces, Datex solves the "trust problem" by allowing buyers to verify dataset quality through secure preview in a TEE environment. The encrypted data is decrypted only within the Nautilus secure enclave, returning a limited preview without exposing the full dataset or decryption keys.

### Vision

Create a trustless, secure, and transparent data marketplace where:
- Data providers can monetize their datasets with guaranteed payment
- Buyers can verify data quality before purchase through TEE-powered preview
- All transactions are transparent and verifiable on-chain

---

## 🚀 Live Deployment

- **Frontend**: [https://datex.vercel.app](https://datex.vercel.app)
- **Network**: Sui Testnet

### 📝 Testnet Contract Addresses

| Contract | Address |
|----------|---------|
| Package ID | `0x3ee8141400c1f4accbe52f3be4291e8faf6051dfbaaea794e052a5bbe974884c` |
| Registry ID | `0x6cf4a393c7543d9f7ccc97759bed957c88bd7c8790284a1fa6275f5aa3b51502` |

**Explorer Links:**
- [Package on SuiScan](https://suiscan.xyz/testnet/object/0x3ee8141400c1f4accbe52f3be4291e8faf6051dfbaaea794e052a5bbe974884c)
- [Registry on SuiScan](https://suiscan.xyz/testnet/object/0x6cf4a393c7543d9f7ccc97759bed957c88bd7c8790284a1fa6275f5aa3b51502)

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATEX ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   SELLER    │     │    BUYER    │     │    BUYER    │                   │
│  │  (Upload)   │     │  (Preview)  │     │ (Purchase)  │                   │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                   │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         NEXT.JS FRONTEND                            │   │
│  │  • Create Listing Form    • Preview Modal    • Purchase Flow        │   │
│  │  • Wallet Integration     • Dataset Browser  • My Data Dashboard    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   WALRUS    │     │  NAUTILUS   │     │     SUI     │                   │
│  │  (Storage)  │     │   (TEE)     │     │ (Blockchain)│                   │
│  │             │     │             │     │             │                   │
│  │ • Blob Store│     │ • Secure    │     │ • Listings  │                   │
│  │ • Content   │     │   Enclave   │     │ • Receipts  │                   │
│  │   Addressed │     │ • Preview   │     │ • Payments  │                   │
│  └──────┬──────┘     │   Decrypt   │     │ • Registry  │                   │
│         │            └──────┬──────┘     └──────┬──────┘                   │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SEAL PROTOCOL                               │   │
│  │  • Threshold Encryption (2-of-N Key Servers)                        │   │
│  │  • Policy-Based Access Control                                      │   │
│  │  • Decryption via TEE or Purchase Receipt                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TailwindCSS 4
- TypeScript
- GSAP (Animations)

**Blockchain:**
- Sui Network (Testnet/Mainnet)
- Move Smart Contracts

**Storage & Encryption:**
- Walrus - Decentralized blob storage
- Seal Protocol - Threshold encryption
- Nautilus TEE - Secure preview environment

**Key Libraries:**
- `@mysten/dapp-kit` - Sui wallet integration
- `@mysten/seal` - Data encryption/decryption
- `@mysten/walrus` - Decentralized storage
- `@mysten/enoki` - Sponsored transactions
- `@tanstack/react-query` - Data fetching

---

## 📋 Core Features

### 1. Dataset Marketplace

#### 1.1 List Dataset
- Upload files to Walrus decentralized storage
- Encrypt data using Seal encryption
- Set price in SUI tokens
- Add metadata (name, description, preview image)
- Support for multiple file types (images, CSV, ZIP archives)

#### 1.2 Browse & Search
- Filter by category (DeFi, Social Graph, Healthcare, Gaming)
- Sort by price, date, or relevance
- Search by keywords
- View verified sellers

#### 1.3 Purchase Flow
- Connect Sui wallet
- Pay with SUI tokens
- Receive purchase receipt (on-chain proof)
- Decrypt and download data

### 2. Nautilus TEE Preview (Key Feature)

Nautilus TEE enables buyers to preview encrypted data without exposing the full dataset or decryption keys.

#### 2.1 How It Works
```
┌─────────────────────────────────────────────────────────────────┐
│                    NAUTILUS TEE PREVIEW FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. BUYER REQUEST                                               │
│     ┌─────────┐                                                 │
│     │  Buyer  │ ──► Sends dataset_id + blob_id                  │
│     └─────────┘     + preview_bytes (e.g., 1024)                │
│                                                                 │
│  2. TEE PROCESSING (Secure Enclave)                             │
│     ┌─────────────────────────────────────────────────────┐     │
│     │  NAUTILUS SERVER                                    │     │
│     │  • Verify TEE attestation (PCR0, PCR1, PCR2)        │     │
│     │  • Fetch encrypted blob from Walrus                 │     │
│     │  • Decrypt using Seal Protocol inside enclave       │     │
│     │  • Extract only preview_bytes of data               │     │
│     │  • Return signed preview response                   │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
│  3. PREVIEW RESPONSE                                            │
│     ┌─────────┐                                                 │
│     │  Buyer  │ ◄── Receives partial decrypted data             │
│     └─────────┘     (e.g., first 1KB of CSV)                    │
│                                                                 │
│  ✓ Full data never leaves TEE                                   │
│  ✓ Decryption keys never exposed                                │
│  ✓ Buyer can verify data quality before purchase                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 Preview API
```typescript
// Request preview via Nautilus TEE
POST /api/debug/nautilus
{
  "dataset_id": "0x...",
  "blob_id": "walrus_blob_id",
  "preview_bytes": 1024,
  "requester_address": "0x...",
  "mime_type": "text/csv",
  "file_name": "data.csv"
}

// Response
{
  "response": {
    "data": {
      "preview_data": "base64_encoded_partial_data",
      "dataset_id": "0x...",
      "size": 1024
    },
    "signature": "tee_attestation_signature"
  }
}
```

### 3. Seal Encryption Integration

#### 3.1 Data Encryption
- Client-side encryption before upload to Walrus
- Threshold encryption (2-of-N key servers)
- Policy-based access control via Move smart contract

#### 3.2 Decryption Flow (After Purchase)
```
1. User purchases dataset → PurchaseReceipt created on-chain
2. Build seal_approve transaction with receipt
3. Create session key for decryption
4. Seal client verifies receipt and decrypts
5. Download full decrypted content
```

### 4. Walrus Storage

- Decentralized blob storage for encrypted datasets
- Content-addressed data (blob_id)
- Supports multiple file types (CSV, images, ZIP archives)
- Integrated with Seal for encrypted storage

### 4. On-Chain Registry

#### 4.1 DatasetRegistry
- Tracks all active listings
- Enables efficient querying
- Maintains listing state

#### 4.2 Query Functions
- `get_all_listings()` - Fetch all listing IDs
- `is_registered()` - Check listing existence
- `listings_count()` - Total active listings

---

## 🔐 Security & Validation

### TEE Security (Nautilus)
- Hardware-based isolation (AWS Nitro Enclaves)
- PCR attestation verification
- Data decrypted only within secure enclave
- Preview data signed by TEE

### Seal Encryption Security
- Threshold encryption (requires 2-of-N key servers)
- Policy-based access control
- Session keys with TTL expiration
- On-chain verification of purchase receipts

### Access Control
- Only sellers can unlist their datasets
- Purchase receipts verify buyer access for full download
- Preview available to all (limited bytes only)

### Financial Security
- Direct payment to seller on purchase
- No escrow required (instant settlement)
- On-chain transaction verification

---

## 📊 Data Model

### DatasetListing Object
```move
struct DatasetListing has key, store {
    id: UID,
    seller: address,
    price: u64,
    blob_id: String,           // Walrus blob ID
    encrypted_object: String,   // Seal encrypted data (hex)
    name: String,
    description: String,
    preview_size: u64,
    total_size: u64,
    image_url: String,
    is_active: bool,
    mime_type: String,
    file_name: String,
    content_type: String,
    file_count: u64,
}
```

### PurchaseReceipt Object
```move
struct PurchaseReceipt has key, store {
    id: UID,
    dataset_id: ID,
    buyer: address,
    seller: address,
    price: u64,
    timestamp: u64,
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm or bun (recommended)
- Sui Wallet (Sui Wallet, Suiet, or Ethos)
- Sui CLI (for contract deployment)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/Vietnam-Sui-Builders/datex.git
cd datex
```

2. Install dependencies:
```bash
bun install
# or
pnpm install
```

3. Copy environment template:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x3ee8141400c1f4accbe52f3be4291e8faf6051dfbaaea794e052a5bbe974884c
NEXT_PUBLIC_REGISTRY_ID=0x6cf4a393c7543d9f7ccc97759bed957c88bd7c8790284a1fa6275f5aa3b51502
NEXT_PUBLIC_ENOKI_API_KEY=your_enoki_api_key
```

### Development Server

```bash
bun dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy Move Contracts

```bash
sui client publish --gas-budget 100000000
```

---

## 📦 Project Structure

```
datex/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── nautilus/            # Nautilus TEE integration
│   │   └── upload-image/        # Image upload handler
│   ├── marketplace/             # Marketplace pages
│   │   ├── create/              # Create listing page
│   │   ├── dataset/[id]/        # Dataset detail page
│   │   └── my-data/             # User's listings
│   └── page.tsx                 # Landing page
├── components/                   # React components
│   ├── marketplace/             # Marketplace-specific components
│   ├── providers/               # Context providers
│   └── ui/                      # Reusable UI components
├── config/                      # Configuration files
├── constants/                   # Constants and enums
├── contexts/                    # React contexts
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
│   ├── marketplace.ts           # Marketplace operations
│   ├── seal.ts                  # Seal encryption utilities
│   └── walrus-payment.ts        # Walrus payment integration
├── types/                       # TypeScript type definitions
└── data_marketplace.move        # Move smart contract
```

---

## 🔄 Workflows

### Seller: Listing Creation Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    LISTING CREATION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Connect Wallet (Sui Wallet / Suiet / Ethos)                 │
│                          │                                      │
│                          ▼                                      │
│  2. Upload File(s) ──► Encrypt with Seal Protocol               │
│                          │                                      │
│                          ▼                                      │
│  3. Store Encrypted Data ──► Walrus (get blob_id)               │
│                          │                                      │
│                          ▼                                      │
│  4. Fill Listing Form (name, description, price, preview image) │
│                          │                                      │
│                          ▼                                      │
│  5. Submit Transaction ──► Create DatasetListing on Sui         │
│                          │                                      │
│                          ▼                                      │
│  6. Listing Indexed in DatasetRegistry                          │
│                          │                                      │
│                          ▼                                      │
│  7. DatasetListed Event Emitted ✓                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Buyer: Preview Flow (via Nautilus TEE)
```
┌─────────────────────────────────────────────────────────────────┐
│                    PREVIEW FLOW (FREE)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Browse Marketplace ──► Select Dataset                       │
│                          │                                      │
│                          ▼                                      │
│  2. Click "Preview" Button                                      │
│                          │                                      │
│                          ▼                                      │
│  3. Request Sent to Nautilus TEE Server                         │
│     • dataset_id, blob_id, preview_bytes                        │
│                          │                                      │
│                          ▼                                      │
│  4. TEE Processing (Secure Enclave)                             │
│     • Fetch encrypted blob from Walrus                          │
│     • Decrypt inside TEE                                        │
│     • Extract preview_bytes only                                │
│                          │                                      │
│                          ▼                                      │
│  5. Preview Modal Shows Partial Data                            │
│     • Animated decryption visualization                         │
│     • First N bytes of actual data                              │
│                          │                                      │
│                          ▼                                      │
│  6. Buyer Verifies Data Quality ✓                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Buyer: Purchase & Download Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    PURCHASE FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Click "Buy" on Dataset                                      │
│                          │                                      │
│                          ▼                                      │
│  2. Wallet Prompts for Payment (SUI)                            │
│                          │                                      │
│                          ▼                                      │
│  3. Payment Transferred to Seller                               │
│                          │                                      │
│                          ▼                                      │
│  4. PurchaseReceipt Created (on-chain proof)                    │
│                          │                                      │
│                          ▼                                      │
│  5. DatasetPurchased Event Emitted                              │
│                          │                                      │
│                          ▼                                      │
│  6. Download via Nautilus (with payment_tx_digest)              │
│     • TEE verifies purchase on-chain                            │
│     • Full data decrypted and returned                          │
│                          │                                      │
│                          ▼                                      │
│  7. Buyer Receives Full Decrypted Dataset ✓                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

- **Data Monetization**: Researchers and data providers can sell datasets directly to buyers with guaranteed payment
- **AI/ML Training Data**: Purchase verified training datasets for machine learning models after previewing sample data
- **Market Research**: Access consumer behavior and market trend data with quality verification
- **Healthcare Data**: Secure exchange of anonymized medical datasets with TEE-protected preview
- **Financial Data**: DeFi analytics and on-chain data products with transparent pricing

---

## 🔮 Future Enhancements

- [ ] Mainnet deployment
- [ ] Enhanced preview options (more bytes, specific columns for CSV)
- [ ] Seller verification and reputation system
- [ ] Rating and review system for datasets
- [ ] Subscription-based access for data streams
- [ ] Data licensing options (commercial, research, etc.)
- [ ] Multi-chain support (other Move-based chains)
- [ ] DAO governance for marketplace fees
- [ ] Bulk purchase discounts
- [ ] Data update notifications for buyers

---

## 📚 Documentation

- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.walrus.site/)
- [Seal Documentation](https://docs.mystenlabs.com/seal)
- [Nautilus TEE Documentation](https://docs.nautilus.sh/)
- [Enoki Documentation](https://docs.enoki.mystenlabs.com/)

---

## 👥 Collaborators

This project was built by:

<table>
<tr>
<td align="center">
<a href="https://github.com/longphu25">
<img src="https://github.com/longphu25.png" width="100px;" alt="Huỳnh Long Phú"/><br />
<sub><b>Huỳnh Long Phú</b></sub>
</a><br />
<a href="https://t.me/longphu25">💬 Telegram</a><br />
<a href="mailto:longphu257@gmail.com">📧 Email</a>
</td>
<td align="center">
<a href="https://github.com/teededung">
<img src="https://github.com/teededung.png" width="100px;" alt="Nguyễn Tuấn Anh"/><br />
<sub><b>Nguyễn Tuấn Anh</b></sub>
</a><br />
<a href="https://t.me/rongmauhong">💬 Telegram</a><br />
<a href="mailto:rongmauhong@protonmail.com">📧 Email</a>
</td>
<td align="center">
<a href="https://github.com/tpSpace">
<img src="https://github.com/tpSpace.png" width="100px;" alt="Nguyễn Mạnh Việt Khôi"/><br />
<sub><b>Nguyễn Mạnh Việt Khôi</b></sub>
</a><br />
<a href="https://t.me/Rocky2077">💬 Telegram</a><br />
<a href="mailto:nmvkhoi@gmail.com">📧 Email</a>
</td>
</tr>
<tr>
<td align="center">
<a href="https://github.com/tuanhqv123">
<img src="https://github.com/tuanhqv123.png" width="100px;" alt="Trần Anh Tuấn"/><br />
<sub><b>Trần Anh Tuấn</b></sub>
</a><br />
<a href="https://t.me/tuanhqv123">💬 Telegram</a><br />
<a href="mailto:tuantrungvuongk62@gmail.com">📧 Email</a>
</td>
<td align="center">
<a href="https://github.com/lamdanghoang">
<img src="https://github.com/lamdanghoang.png" width="100px;" alt="Đặng Hoàng Lâm"/><br />
<sub><b>Đặng Hoàng Lâm</b></sub>
</a><br />
<a href="https://t.me/danghlam">💬 Telegram</a><br />
<a href="mailto:danghlambk14@gmail.com">📧 Email</a>
</td>
<td></td>
</tr>
</table>

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is built for hackathon purposes. Please check with the repository owner for licensing details.

---

## 🆘 Support

For bugs or feature requests, please [open an issue](https://github.com/Vietnam-Sui-Builders/datex/issues) on GitHub.

---

<div align="center">

**Built with ❤️ on Sui Blockchain**

</div>
