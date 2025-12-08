"use client";
import {
  getParticuliers,
  Particulier as ParticulierType,
  PaginationResponse,
} from "@/services/particuliers/particulierService";
import ParticuliersClient from "./components/ParticulierClient";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

// SUPPRIMER ces deux lignes - elles ne sont pas compatibles avec "use client"
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

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
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadParticuliers();
    }
  }, [utilisateur, authLoading]);

  if (authLoading || loading) {
    return <div>Chargement...</div>;
  }

  return (
    <ParticuliersClient
      initialParticuliers={particuliers}
      initialError={error}
      initialPagination={pagination}
    />
  );
}