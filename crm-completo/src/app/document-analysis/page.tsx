import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { DocumentAnalysisPage } from '@/components/document-analysis/document-analysis-page';

export default async function Page() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/crm/login');
  }

  return (
    <AppLayout>
      <DocumentAnalysisPage />
    </AppLayout>
  );
}
