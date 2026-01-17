'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';

export function WalletRedirect() {
  const account = useCurrentAccount();
  const router = useRouter();

  useEffect(() => {
    if (account) {
      router.replace('/marketplace/my-listings');
    }
  }, [account, router]);

  return null;
}
