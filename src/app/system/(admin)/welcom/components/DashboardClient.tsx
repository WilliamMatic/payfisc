'use client';
import { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import QuickActions from './QuickActions';
import StatsOverview from './StatsOverview';
import AlertMessage from './AlertMessage';

interface StatsData {
  total_contribuables: number;
  total_provinces: number;
  total_paiements: number;
  total_sites: number;
}

interface DashboardClientProps {
  statsData: StatsData;
}

export default function DashboardClient({ statsData }: DashboardClientProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col">
      <AlertMessage error={error} successMessage={successMessage} />
      
      <div className="max-w-6xl mx-auto w-full">
        <DashboardHeader />
        
        <QuickActions />
        
        <StatsOverview statsData={statsData} />
      </div>
    </div>
  );
}