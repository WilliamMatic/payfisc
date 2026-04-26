"use client";
import { useEffect, useMemo, useState } from "react";
import GenericCrudClient, { GenericField } from "../../_shared/GenericCrudClient";
import { getCommunes, addCommune, updateCommune, deleteCommune, getVilles } from "@/services/foncier/foncierService";
import { Commune, Ville } from "@/services/foncier/types";
import { useAuth } from "@/contexts/AuthContext";

export default function CommunesClient() {
  const { utilisateur } = useAuth();
  const [villes, setVilles] = useState<Ville[]>([]);

  useEffect(() => {
    if (!utilisateur?.site_id) return;
    getVilles(utilisateur.site_id, 1, 500, "").then((r) => {
      if (r.status === "success" && r.data) setVilles(r.data.villes);
    });
  }, [utilisateur?.site_id]);

  const fields: GenericField[] = useMemo(() => [
    { name: "nom", label: "Nom de la commune", required: true, placeholder: "Ex: Gombe" },
    { name: "ville_id", label: "Ville", type: "select", required: true,
      options: villes.map((v) => ({ value: v.id, label: v.nom })) },
  ], [villes]);

  const loader = async (siteId: number) => await getCommunes(siteId);

  return (
    <GenericCrudClient<Commune>
      title="Communes"
      icon="🏘️"
      loader={loader}
      onAdd={addCommune}
      onUpdate={updateCommune}
      onDelete={deleteCommune}
      fields={fields}
      columns={[
        { key: "nom", label: "Commune" },
        { key: "ville_nom", label: "Ville", render: (r) => r.ville_nom || "—" },
      ]}
      searchKeys={["nom", "ville_nom"]}
    />
  );
}
