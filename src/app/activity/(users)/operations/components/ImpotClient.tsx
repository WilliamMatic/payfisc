'use client';
import { useState, useEffect } from 'react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import ImpotHeader from './ImpotHeader';
import ImpotGrid from './ImpotGrid';
import AlertMessage from './AlertMessage';

interface ImpotClientProps {
  initialImpots: ImpotType[];
  initialError: string | null;
}

export default function ImpotClient({ initialImpots, initialError }: ImpotClientProps) {
  const [impots, setImpots] = useState<ImpotType[]>(initialImpots || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les impôts
  const loadImpots = async () => {
    try {
      setLoading(true);
      const { getImpots } = await import('@/services/impots/impotService');
      const result = await getImpots();
      
      if (result.status === 'success') {
        setImpots(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des impôts');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des impôts
  const filteredImpots = impots.filter(impot =>
    impot && (
      impot.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      impot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      impot.periode.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Effacer les messages après un délai
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="h-full flex flex-col">
      <AlertMessage error={error} successMessage={successMessage} />
      
      <ImpotHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        impotsCount={filteredImpots.length}
      />

      <ImpotGrid
        impots={filteredImpots}
        loading={loading}
      />
    </div>
  );
}