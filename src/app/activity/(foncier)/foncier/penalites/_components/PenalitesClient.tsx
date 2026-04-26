"use client";
import GenericCrudClient, { GenericField } from "../../_shared/GenericCrudClient";
import { getPenalites, addPenalite, updatePenalite, deletePenalite } from "@/services/foncier/foncierService";
import { Penalite } from "@/services/foncier/types";

const fields: GenericField[] = [
  { name: "nom", label: "Nom", required: true, placeholder: "Pénalité de retard" },
  { name: "taux_pourcentage", label: "Taux (%)", type: "number", step: "0.01", placeholder: "10" },
  { name: "delai_jours", label: "Délai (jours après échéance)", type: "number", placeholder: "30" },
];

export default function PenalitesClient() {
  return (
    <GenericCrudClient<Penalite>
      title="Pénalités"
      icon="⏱️"
      loader={(siteId) => getPenalites(siteId)}
      onAdd={addPenalite}
      onUpdate={updatePenalite}
      onDelete={deletePenalite}
      fields={fields}
      columns={[
        { key: "nom", label: "Nom" },
        { key: "taux_pourcentage", label: "Taux %", render: (r) => `${r.taux_pourcentage}%` },
        { key: "delai_jours", label: "Délai (j)" },
      ]}
      searchKeys={["nom"]}
    />
  );
}
