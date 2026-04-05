'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { AppLayout } from '@/components/layout/app-layout';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { Toaster } from '@/components/ui/sonner';

export default function HomePage() {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
