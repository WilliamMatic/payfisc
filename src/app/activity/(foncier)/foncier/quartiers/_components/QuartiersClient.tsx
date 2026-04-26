"use client";
import { useEffect, useMemo, useState } from "react";
import GenericCrudClient, { GenericField } from "../../_shared/GenericCrudClient";
import { getQuartiers, addQuartier, updateQuartier, deleteQuartier, getCommunes, getRangs } from "@/services/foncier/foncierService";
import { Quartier, Commune, RangFiscal } from "@/services/foncier/types";
import { useAuth } from "@/contexts/AuthContext";

export default function QuartiersClient() {
  const { utilisateur } = useAuth();
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [rangs, setRangs] = useState<RangFiscal[]>([]);

  useEffect(() => {
    if (!utilisateur?.site_id) return;
    getCommunes(utilisateur.site_id).then((r) => { if (r.status === "success" && r.data) setCommunes(r.data); });
    getRangs(utilisateur.site_id).then((r) => { if (r.status === "success" && r.data) setRangs(r.data); });
  }, [utilisateur?.site_id]);

  const fields: GenericField[] = useMemo(() => [
    { name: "nom", label: "Nom du quartier", required: true },
    { name: "commune_id", label: "Commune", type: "select", required: true,
      options: communes.map((c) => ({ value: c.id, label: c.nom })) },
    { name: "rang_fiscal_id", label: "Rang fiscal", type: "select",
      options: rangs.map((r) => ({ value: r.id, label: r.nom })) },
  ], [communes, rangs]);

  const loader = async (siteId: number) => await getQuartiers(siteId);

  return (
    <GenericCrudClient<Quartier>
      title="Quartiers"
      icon="📍"
      loader={loader}
      onAdd={addQuartier}
      onUpdate={updateQuartier}
      onDelete={deleteQuartier}
      fields={fields}
      columns={[
        { key: "nom", label: "Quartier" },
        { key: "commune_nom", label: "Commune", render: (r) => r.commune_nom || "—" },
        { key: "rang_fiscal_nom", label: "Rang fiscal", render: (r) => r.rang_fiscal_nom || "—" },
      ]}
      searchKeys={["nom", "commune_nom"]}
    />
  );
}
