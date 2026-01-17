// Seal SDK integration for threshold encryption with purchase-based access control
// Uses @mysten/seal for real threshold encryption on Sui testnet
// Pattern: Allowlist Encryption - only users with PurchaseReceipt can decrypt

import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { fromBase64, toBase64 } from '@mysten/sui/utils'

// === Configuration ===
const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet') || 'testnet'
const SEAL_POLICY_PACKAGE_ID = process.env.NEXT_PUBLIC_SEAL_POLICY_PACKAGE_ID || ''

//  Seal Key Servers for Testnet
const SEAL_KEY_SERVER_CONFIGS = [
    {
        objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
        weight: 1,
    },
    {
        objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
        weight: 1,
    },
    {
        objectId: '0x6a0726a1ea3d62ba2f2ae51104f2c3633c003fb75621d06fde47f04dc930ba06',
        weight: 1,
    },
]

let sealClient: SealClient | null = null
let suiClient: SuiClient | null = null

// === Client Initialization ===

function getSuiClient(): SuiClient {
    if (!suiClient) {
        suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) })
    }
    return suiClient
}

function getSealClient(): SealClient {
    if (!sealClient) {
        sealClient = new SealClient({
            suiClient: getSuiClient(),
            serverConfigs: SEAL_KEY_SERVER_CONFIGS,
            verifyKeyServers: false,
        })
    }
    return sealClient
}

// === Helper Functions ===

export function uint8ArrayToBase64(bytes: Uint8Array): string {
    return toBase64(bytes)
}

export function base64ToUint8Array(base64: string): Uint8Array {
    return fromBase64(base64)
}

// === Seal Threshold Encryption ===

// Check if Seal is available
export function isSealAvailable(): boolean {
    return !!SEAL_POLICY_PACKAGE_ID && SEAL_POLICY_PACKAGE_ID !== '0x0'
}

/**
 * Encrypt data using Seal threshold encryption
 * Only users with valid access (via seal_approve) can decrypt
 * 
 * @param data - Raw data to encrypt
 * @param policyObjectId - ID of the policy object that controls access (e.g., listing ID)
 */
export async function encryptWithSeal(
    data: Uint8Array,
    policyObjectId: string
): Promise<Uint8Array> {
    const client = getSealClient()

    console.log('[Seal] Encrypting...', {
        dataSize: data.length,
        policyObjectId,
        packageId: SEAL_POLICY_PACKAGE_ID,
    })

    const { encryptedObject } = await client.encrypt({
        threshold: 2,
        packageId: SEAL_POLICY_PACKAGE_ID,
        id: policyObjectId, // Policy object ID that controls decryption access
        data,
    })

    // encryptedObject is already a Uint8Array
    const encryptedBytes = encryptedObject

    console.log('[Seal] Encrypted:', {
        originalSize: data.length,
        encryptedSize: encryptedBytes.length
    })

    return encryptedBytes
}

/**
 * Decrypt data using Seal threshold encryption
 * Requires a valid session key and transaction that proves access
 * 
 * @param encryptedBytes - The encrypted data (serialized EncryptedObject)
 * @param sessionKey - Session key for decryption
 * @param txBytes - Transaction bytes that call seal_approve
 */
export async function decryptWithSeal(
    encryptedBytes: Uint8Array,
    sessionKey: SessionKey,
    txBytes: Uint8Array
): Promise<Uint8Array> {
    const client = getSealClient()

    console.log('[Seal] Decrypting...', {
        encryptedSize: encryptedBytes.length,
    })

    try {
        const decrypted = await client.decrypt({
            data: encryptedBytes,
            sessionKey,
            txBytes,
        })

        console.log('[Seal] Decrypted:', { decryptedSize: decrypted.length })
        return decrypted
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error('[Seal] Decrypt error:', errorMsg)
        if (errorMsg.includes('ENoAccess') || errorMsg.includes('assert')) {
            throw new Error('Access denied: You do not have permission to decrypt this data')
        }
        throw error
    }
}

// === High-Level API ===

/**
 * Encrypt a file for upload to Walrus
 * 
 * @param file - The file to encrypt
 * @param policyObjectId - Policy object ID for access control
 */
export async function encryptFile(
    file: File,
    policyObjectId: string
): Promise<{ encryptedBlob: Blob; policyId: string }> {
    const arrayBuffer = await file.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)

    if (!isSealAvailable()) {
        throw new Error('Seal is not configured. Please set NEXT_PUBLIC_SEAL_POLICY_PACKAGE_ID')
    }

    console.log('[Seal] Encrypting file...', {
        fileName: file.name,
        size: data.length,
        policyObjectId,
    })

    const encryptedBytes = await encryptWithSeal(data, policyObjectId)

    return {
        encryptedBlob: new Blob([encryptedBytes.slice()], { type: 'application/octet-stream' }),
        policyId: policyObjectId,
    }
}

/**
 * Encrypt raw data for upload
 */
export async function encryptData(
    data: Uint8Array,
    policyObjectId: string
): Promise<{ encryptedData: Uint8Array; policyId: string }> {
    if (!isSealAvailable()) {
        throw new Error('Seal is not configured. Please set NEXT_PUBLIC_SEAL_POLICY_PACKAGE_ID')
    }

    const encryptedData = await encryptWithSeal(data, policyObjectId)

    return {
        encryptedData,
        policyId: policyObjectId,
    }
}

/**
 * Create a session key for decryption
 * Used by buyers to decrypt purchased data
 * 
 * Uses the two-step flow since wallet adapters provide signPersonalMessage
 * rather than a full Signer object
 */
export async function createSessionKey(
    userAddress: string,
    signPersonalMessage: (msg: { message: Uint8Array }) => Promise<{ signature: string }>
): Promise<SessionKey> {
    const suiClient = getSuiClient()

    // Step 1: Create session key without signer
    const sessionKey = await SessionKey.create({
        address: userAddress,
        packageId: SEAL_POLICY_PACKAGE_ID,
        ttlMin: 10,
        suiClient,
    })

    // Step 2: Get the personal message that needs to be signed
    const personalMessage = sessionKey.getPersonalMessage()

    // Step 3: Sign the message using the wallet adapter's signPersonalMessage
    const { signature } = await signPersonalMessage({ message: personalMessage })

    // Step 4: Set the signature on the session key
    await sessionKey.setPersonalMessageSignature(signature)

    return sessionKey
}

/**
 * Build seal_approve transaction for marketplace purchase verification
 * The Move function should verify the caller owns a PurchaseReceipt
 */
export function buildSealApproveTransaction(
    policyObjectId: string,
    purchaseReceiptId: string
): Transaction {
    const tx = new Transaction()

    // Call the seal_approve function in your marketplace module
    // This should verify the caller has a valid PurchaseReceipt for this listing
    tx.moveCall({
        target: `${SEAL_POLICY_PACKAGE_ID}::marketplace::seal_approve`,
        arguments: [
            tx.pure.id(policyObjectId), // The listing/policy ID
            tx.object(purchaseReceiptId), // User's PurchaseReceipt
        ],
    })

    return tx
}

/**
 * Decrypt a file after purchase
 * Requires valid PurchaseReceipt
 */
export async function decryptFile(
    encryptedBlob: Blob,
    policyObjectId: string,
    purchaseReceiptId: string,
    userAddress: string,
    signPersonalMessage: (msg: { message: Uint8Array }) => Promise<{ signature: string }>,
    originalType: string = 'application/octet-stream'
): Promise<Blob> {
    const arrayBuffer = await encryptedBlob.arrayBuffer()
    const encryptedBytes = new Uint8Array(arrayBuffer)

    // Create session key
    const sessionKey = await createSessionKey(userAddress, signPersonalMessage)

    // Build seal_approve transaction
    const tx = buildSealApproveTransaction(policyObjectId, purchaseReceiptId)
    const txBytes = await tx.build({ client: getSuiClient(), onlyTransactionKind: true })

    // Decrypt
    const decrypted = await decryptWithSeal(encryptedBytes, sessionKey, txBytes)

    return new Blob([decrypted.slice()], { type: originalType })
}

/**
 * Decrypt raw data after purchase
 */
export async function decryptData(
    encryptedData: Uint8Array,
    policyObjectId: string,
    purchaseReceiptId: string,
    userAddress: string,
    signPersonalMessage: (msg: { message: Uint8Array }) => Promise<{ signature: string }>
): Promise<Uint8Array> {
    const sessionKey = await createSessionKey(userAddress, signPersonalMessage)
    const tx = buildSealApproveTransaction(policyObjectId, purchaseReceiptId)
    const txBytes = await tx.build({ client: getSuiClient(), onlyTransactionKind: true })

    return decryptWithSeal(encryptedData, sessionKey, txBytes)
}

// === Type Exports ===

export interface EncryptionPolicy {
    type: 'purchase' // Only purchase-based access for marketplace
    policyObjectId: string
}

export interface PurchaseAccess {
    listingId: string
    purchaseReceiptId: string
    buyer: string
}