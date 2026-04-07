'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { AppLayout } from '@/components/layout/app-layout';
import { DocumentLibraryPage } from '@/components/document-library/document-library-page';
import { Toaster } from '@/components/ui/sonner';

function DocumentLibraryContent() {
  return (
    <AppLayout>
      <DocumentLibraryPage />
    </AppLayout>
  );
}

export default function DocumentLibraryPageRoute() {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <DocumentLibraryContent />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
