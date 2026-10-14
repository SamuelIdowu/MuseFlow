import { getDashboardOverviewData } from '@/lib/dashboardServerActions';
import { DashboardOverview } from './components/DashboardOverview';

// Force dynamic rendering because this route uses auth() which requires headers
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const overviewData = await getDashboardOverviewData();

  return (
    <div className="w-full min-h-full p-4 sm:p-6 lg:p-8">
      <DashboardOverview initialData={overviewData} />
    </div>
  );
}

