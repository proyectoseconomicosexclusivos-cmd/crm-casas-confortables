'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { AppLayout } from '@/components/layout/app-layout';
import { LeadsPipeline } from '@/components/leads/leads-pipeline';
import { Toaster } from '@/components/ui/sonner';

export default function LeadsPage() {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Pipeline de Leads
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Gestiona y visualiza tus leads en el pipeline Kanban
              </p>
            </div>
            <LeadsPipeline />
          </div>
        </AppLayout>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
