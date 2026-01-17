// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Dataset Marketplace Module
/// Manages dataset listings, purchases, and access control
module dataset_marketplace::marketplace;

use enclave::enclave;
use std::string::String;
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;
use sui::vec_set::{Self, VecSet};

// ============ Error codes ============
const EInsufficientPayment: u64 = 0;
// const EDatasetNotFound: u64 = 1;
// const ENotSeller: u64 = 2;
// const EAlreadyPurchased: u64 = 3;

// ============ One-Time Witness ============
public struct MARKETPLACE has drop {}

// ============ Init ============
fun init(otw: MARKETPLACE, ctx: &mut TxContext) {
    let cap = enclave::new_cap(otw, ctx);

    cap.create_enclave_config(
        b"dataset marketplace".to_string(),
        x"c44ce89e1c054687c4546e1d853e4821afb5ef8761484226c28687aa6f0dc7d2a0d3ec038a24828a62e68b1f3a3e72e6", // pcr0
        x"c44ce89e1c054687c4546e1d853e4821afb5ef8761484226c28687aa6f0dc7d2a0d3ec038a24828a62e68b1f3a3e72e6", // pcr1
        x"21b9efbc184807662e966d34f390821309eeac6802309798826296bf3e8bec7c10edb30948c90ba67310f7b964fc500a", // pcr2
        ctx,
    );

    transfer::public_transfer(cap, ctx.sender());

    // Create and share registry
    let registry = DatasetRegistry {
        id: object::new(ctx),
        listings: vec_set::empty(),
    };
    transfer::share_object(registry);
}

// ============ Structs ============

/// Registry containing all DatasetListing IDs
public struct DatasetRegistry has key, store {
    id: UID,
    listings: VecSet<ID>,
}

/// Dataset listing created by seller
public struct DatasetListing has key, store {
    id: UID,
    seller: address,
    price: u64,
    blob_id: String, // Walrus blob ID
    encrypted_object: String, // Seal encrypted object (hex)
    name: String,
    description: String,
    preview_size: u64, // Bytes available for preview
    total_size: u64,
}

/// Purchase receipt - proof that buyer paid for dataset
public struct PurchaseReceipt has key, store {
    id: UID,
    dataset_id: ID,
    buyer: address,
    seller: address,
    price: u64,
    timestamp: u64,
}

// ============ Events ============

public struct DatasetListed has copy, drop {
    dataset_id: ID,
    seller: address,
    price: u64,
    name: String,
}

public struct DatasetPurchased has copy, drop {
    dataset_id: ID,
    buyer: address,
    seller: address,
    price: u64,
}

// ============ Functions ============

/// Create a new dataset listing
public fun list_dataset(
    registry: &mut DatasetRegistry,
    blob_id: String,
    encrypted_object: String,
    name: String,
    description: String,
    price: u64,
    preview_size: u64,
    total_size: u64,
    ctx: &mut TxContext,
): DatasetListing {
    let listing = DatasetListing {
        id: object::new(ctx),
        seller: ctx.sender(),
        price,
        blob_id,
        encrypted_object,
        name,
        description,
        preview_size,
        total_size,
    };

    // Register to registry
    vec_set::insert(&mut registry.listings, object::id(&listing));

    event::emit(DatasetListed {
        dataset_id: object::id(&listing),
        seller: ctx.sender(),
        price,
        name,
    });

    listing
}

/// Purchase a dataset - creates receipt and transfers payment to seller
public fun purchase_dataset(
    listing: &DatasetListing,
    payment: Coin<SUI>,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): PurchaseReceipt {
    assert!(coin::value(&payment) >= listing.price, EInsufficientPayment);

    // Transfer payment to seller
    transfer::public_transfer(payment, listing.seller);

    let receipt = PurchaseReceipt {
        id: object::new(ctx),
        dataset_id: object::id(listing),
        buyer: ctx.sender(),
        seller: listing.seller,
        price: listing.price,
        timestamp: sui::clock::timestamp_ms(clock),
    };

    event::emit(DatasetPurchased {
        dataset_id: object::id(listing),
        buyer: ctx.sender(),
        seller: listing.seller,
        price: listing.price,
    });

    receipt
}

// ============ Registry Functions ============

/// Check if listing exists in registry
public fun is_registered(registry: &DatasetRegistry, listing_id: ID): bool {
    vec_set::contains(&registry.listings, &listing_id)
}

/// Remove listing from registry
public fun unregister_listing(registry: &mut DatasetRegistry, listing_id: ID) {
    vec_set::remove(&mut registry.listings, &listing_id);
}

/// Number of listings in registry
public fun listings_count(registry: &DatasetRegistry): u64 {
    vec_set::length(&registry.listings)
}

/// Get all listing IDs
public fun get_all_listings(registry: &DatasetRegistry): vector<ID> {
    *vec_set::keys(&registry.listings)
}

// ============ Test Only Functions ============

#[test_only]
public fun new_registry_for_testing(ctx: &mut TxContext): DatasetRegistry {
    DatasetRegistry {
        id: object::new(ctx),
        listings: vec_set::empty(),
    }
}
