import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { toHex, fromHex } from '@mysten/sui/utils';

// Network config
const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet';

// Seal Key Servers for Testnet
const SEAL_KEY_SERVERS_TESTNET = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
];

// Seal Key Servers for Mainnet (update when available)
const SEAL_KEY_SERVERS_MAINNET = SEAL_KEY_SERVERS_TESTNET;

function getKeyServers(): string[] {
  return NETWORK === 'mainnet' ? SEAL_KEY_SERVERS_MAINNET : SEAL_KEY_SERVERS_TESTNET;
}

// Marketplace policy package ID for Seal encryption
const MARKETPLACE_POLICY_PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';

// Marketplace package ID
const MARKETPLACE_PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';

// Singleton clients
let sealClient: SealClient | null = null;
let suiClient: SuiClient | null = null;

export function getSuiClient(): SuiClient {
  if (!suiClient) {
    suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });
  }
  return suiClient;
}

export function getSealClient(): SealClient {
  if (!sealClient) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sealClient = new SealClient({
      suiClient: getSuiClient() as SuiClient,
      serverConfigs: getKeyServers().map(id => ({ objectId: id, weight: 1 })),
      verifyKeyServers: false,
    });
  }
  return sealClient;
}

export interface EncryptResult {
  encryptedBytes: Uint8Array;
  encryptedHex: string;
}

/**
 * Encrypt data for marketplace using Seal
 * Uses marketplace_policy.move which requires id = [0]
 */
export async function encryptForMarketplace(
  data: Uint8Array,
  customSuiClient?: SuiClient,
): Promise<EncryptResult> {
  const client = customSuiClient || getSuiClient();
  
  console.log('=== SEAL ENCRYPT FOR MARKETPLACE ===');
  console.log('Data size:', data.length);
  console.log('Package ID:', MARKETPLACE_POLICY_PACKAGE_ID);
  console.log('Network:', NETWORK);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sealClient = new SealClient({
    suiClient: client as any,
    serverConfigs: getKeyServers().map(id => ({ objectId: id, weight: 1 })),
    verifyKeyServers: false,
  });

  // ID must be [0] according to marketplace_policy.move
  const id = new Uint8Array([0]);
  console.log('Policy ID:', Array.from(id));

  const { encryptedObject } = await sealClient.encrypt({
    threshold: 2,
    packageId: MARKETPLACE_POLICY_PACKAGE_ID,
    id: toHex(id),
    data: data,
  });

  console.log('Encryption successful');

  // encryptedObject is already Uint8Array
  const encryptedBytes = encryptedObject;
  const encryptedHex = toHex(encryptedBytes);

  console.log('Encrypted bytes size:', encryptedBytes.length);
  console.log('Encrypted hex (first 64 chars):', encryptedHex.slice(0, 64));

  return {
    encryptedBytes,
    encryptedHex,
  };
}

/**
 * Decrypt data using Seal
 * Requires a valid session key and transaction bytes that prove purchase
 * 
 * @param encryptedData - Encrypted bytes or hex string
 * @param sessionKey - Session key for decryption
 * @param txBytes - Transaction bytes that call seal_approve
 */
export async function decryptData(
  encryptedData: Uint8Array | string,
  sessionKey: SessionKey,
  txBytes: Uint8Array,
): Promise<Uint8Array> {
  const client = getSealClient();

  console.log('=== SEAL DECRYPT ===');

  // Convert hex string to bytes if needed
  const encryptedBytes = typeof encryptedData === 'string' 
    ? fromHex(encryptedData)
    : encryptedData;

  console.log('Encrypted bytes size:', encryptedBytes.length);

  // Decrypt using session key
  const decryptedData = await client.decrypt({
    data: encryptedBytes,
    sessionKey,
    txBytes,
  });

  console.log('Decryption successful');
  console.log('Decrypted data size:', decryptedData.length);

  return decryptedData;
}

/**
 * Create a session key for decryption
 * 
 * @param address - User's wallet address
 * @param packageId - Package ID for the policy
 * @param ttlMin - Time to live in minutes (default 10)
 * @param signer - Optional signer for signing the session key
 */
export async function createSessionKey(
  address: string,
  packageId: string = MARKETPLACE_PACKAGE_ID,
  ttlMin: number = 10,
  signer?: Parameters<typeof SessionKey.create>[0]['signer'],
): Promise<SessionKey> {
  console.log('=== CREATE SESSION KEY ===');
  console.log('Address:', address);
  console.log('Package ID:', packageId);
  console.log('TTL (min):', ttlMin);

  const sessionKey = await SessionKey.create({
    address,
    packageId,
    ttlMin,
    signer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    suiClient: getSuiClient() as any,
  });

  console.log('Session key created');

  return sessionKey;
}

/**
 * Build transaction for seal approval (needed for decryption)
 * This transaction proves the user has purchased the dataset
 */
export function buildSealApprovalTx(
  listingId: string,
  receiptId: string,
): Transaction {
  const tx = new Transaction();

  // Call the seal_approve function from marketplace contract
  // This function verifies the purchase receipt and returns approval
  tx.moveCall({
    target: `${MARKETPLACE_PACKAGE_ID}::marketplace::seal_approve`,
    arguments: [
      tx.object(listingId),
      tx.object(receiptId),
    ],
  });

  return tx;
}

/**
 * Helper to convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return toHex(bytes);
}

/**
 * Helper to convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  return fromHex(hex);
}

// Re-export types
export { SessionKey, EncryptedObject };
