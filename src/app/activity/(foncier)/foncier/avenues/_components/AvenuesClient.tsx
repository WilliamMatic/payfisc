"use client";
import { useEffect, useMemo, useState } from "react";
import GenericCrudClient, { GenericField } from "../../_shared/GenericCrudClient";
import { getAvenues, addAvenue, updateAvenue, deleteAvenue, getQuartiers } from "@/services/foncier/foncierService";
import { Avenue, Quartier } from "@/services/foncier/types";
import { useAuth } from "@/contexts/AuthContext";

export default function AvenuesClient() {
  const { utilisateur } = useAuth();
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);

  useEffect(() => {
    if (!utilisateur?.site_id) return;
    getQuartiers(utilisateur.site_id).then((r) => { if (r.status === "success" && r.data) setQuartiers(r.data); });
  }, [utilisateur?.site_id]);

  const fields: GenericField[] = useMemo(() => [
    { name: "nom", label: "Nom de l'avenue", required: true },
    { name: "quartier_id", label: "Quartier", type: "select", required: true,
      options: quartiers.map((q) => ({ value: q.id, label: `${q.nom}${q.commune_nom ? ` (${q.commune_nom})` : ""}` })) },
  ], [quartiers]);

  return (
    <GenericCrudClient<Avenue>
      title="Avenues"
      icon="🛣️"
      loader={(siteId) => getAvenues(siteId)}
      onAdd={addAvenue}
      onUpdate={updateAvenue}
      onDelete={deleteAvenue}
      fields={fields}
      columns={[
        { key: "nom", label: "Avenue" },
        { key: "quartier_nom", label: "Quartier", render: (r) => r.quartier_nom || "—" },
      ]}
      searchKeys={["nom", "quartier_nom"]}
    />
  );
}
