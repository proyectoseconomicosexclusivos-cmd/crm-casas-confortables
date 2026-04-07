'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { AppLayout } from '@/components/layout/app-layout';
import { GamificationDashboard } from '@/components/gamification/gamification-dashboard';
import { Toaster } from '@/components/ui/sonner';

export default function GamificationPage() {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppLayout>
          <GamificationDashboard />
        </AppLayout>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
