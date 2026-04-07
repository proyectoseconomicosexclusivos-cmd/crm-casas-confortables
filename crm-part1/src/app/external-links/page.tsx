'use client';

import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/layout/app-layout';
import { ExternalLinksPage as ExternalLinksContent } from '@/components/external-links/external-links-page';
import { LoginPage } from '@/components/auth/login-page';

export default function ExternalLinksRoute() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <ExternalLinksContent />
    </AppLayout>
  );
}
