"use client";

import { useState, useEffect } from "react";
import { Impot, getImpotsActifs } from "@/services/impots/impotService";
import ImpotClient from "./ImpotClient";

interface Props {
  site_code: string;
}

export default function ImpotsContentLoader({ site_code }: Props) {
  const [impots, setImpots] = useState<Impot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const result = await getImpotsActifs(site_code);

        if (result.status === "error") {
          setError(result.message ?? "Erreur inconnue lors du chargement des impôts");
          setImpots([]);
        } else {
          const cleaned: Impot[] = (result.data || []).filter(
            (impot: Impot | null | undefined): impot is Impot =>
              impot !== null && impot !== undefined
          );
          setImpots(cleaned);
          setError(null);
        }
      } catch {
        setError("Erreur lors du chargement des données");
        setImpots([]);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [site_code]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <ImpotClient initialImpots={impots} initialError={error} />;
}