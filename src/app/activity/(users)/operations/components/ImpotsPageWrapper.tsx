"use client";

import { useAuth } from "@/contexts/AuthContext";
import ImpotsContentLoader from "./ImpotsContentLoader";

export default function ImpotsPageWrapper() {
  const { utilisateur, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!utilisateur?.site_code) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Utilisateur non identifié ou site non configuré.</p>
      </div>
    );
  }

  return <ImpotsContentLoader site_code={utilisateur.site_code} />;
}