'use client';
import { useState } from 'react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import ImpotServicesHeader from './ImpotServicesHeader';
import ServicesGrid from './ServicesGrid';
import AlertMessage from './AlertMessage';

interface ImpotServicesClientProps {
  impot: ImpotType;
}

export default function ImpotServicesClient({ impot }: ImpotServicesClientProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <AlertMessage error={error} successMessage={successMessage} />
        
        <ImpotServicesHeader impot={impot} />
        
        <ServicesGrid impot={impot} />
      </div>
    </div>
  );
}