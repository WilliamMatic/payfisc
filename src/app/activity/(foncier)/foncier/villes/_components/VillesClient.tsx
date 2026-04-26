"use client";
import { useMemo } from "react";
import GenericCrudClient, { GenericField } from "../../_shared/GenericCrudClient";
import { getVilles, addVille, updateVille, deleteVille } from "@/services/foncier/foncierService";
import { Ville } from "@/services/foncier/types";
import { useAuth } from "@/contexts/AuthContext";

export default function VillesClient() {
  const { utilisateur } = useAuth();
  const fields: GenericField[] = useMemo(() => [
    { name: "nom", label: "Nom de la ville", required: true, placeholder: "Ex: Kinshasa" },
  ], []);

  const loader = async (siteId: number) => {
    const r = await getVilles(siteId, 1, 500, "");
    return { status: r.status, data: r.data?.villes };
  };

  return (
    <GenericCrudClient<Ville>
      title="Villes"
      icon="🏙️"
      loader={loader}
      onAdd={(d) => addVille({ ...d, province_id: utilisateur?.province_id })}
      onUpdate={(d) => updateVille({ ...d, province_id: utilisateur?.province_id })}
      onDelete={deleteVille}
      fields={fields}
      columns={[
        { key: "nom", label: "Ville" },
        { key: "province_nom", label: "Province", render: (r) => r.province_nom || "—" },
      ]}
      searchKeys={["nom"]}
    />
  );
}
