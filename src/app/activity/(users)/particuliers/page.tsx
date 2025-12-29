"use client";
import {
  getParticuliers,
  Particulier as ParticulierType,
  PaginationResponse,
} from "@/services/particuliers/particulierService";
import ParticuliersClient from "./components/ParticulierClient";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

// Composant Loader simple et propre
const SimpleLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Chargement des particuliers...</p>
      </div>
    </div>
  );
};

export default function ParticuliersPage() {
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [particuliers, setParticuliers] = useState<ParticulierType[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParticuliers() {
      try {
        setLoading(true);
        const utilisateurId = utilisateur?.id;
        const result = await getParticuliers(1, 10, utilisateurId);

        if (result.status === "success" && result.data) {
          const filteredParticuliers = (result.data.particuliers || []).filter(
            (particulier: ParticulierType | null | undefined): particulier is ParticulierType =>
              particulier !== null && particulier !== undefined
          );
          setParticuliers(filteredParticuliers);
          setPagination(result.data.pagination || pagination);
        } else if (result.status === "error") {
          setError(result.message ?? "Erreur inconnue");
        }
      } catch (error) {
        console.error("Error loading particuliers:", error);
        setError("Erreur lors du chargement des particuliers");
      } finally {
        // Petit délai pour éviter le flash du loader
        setTimeout(() => setLoading(false), 500);
      }
    }

    if (!authLoading) {
      loadParticuliers();
    }
  }, [utilisateur, authLoading]);

  if (authLoading || loading) {
    return <SimpleLoader />;
  }

  return (
    <ParticuliersClient
      initialParticuliers={particuliers}
      initialError={error}
      initialPagination={pagination}
    />
  );
}