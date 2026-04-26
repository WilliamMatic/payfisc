"use client";
import GenericCrudClient, { GenericField } from "../../_shared/GenericCrudClient";
import { getAffectations, addAffectation, updateAffectation, deleteAffectation } from "@/services/foncier/foncierService";
import { Affectation } from "@/services/foncier/types";

const fields: GenericField[] = [
  { name: "nom", label: "Nom", required: true, placeholder: "Résidentiel, Commercial..." },
  { name: "code", label: "Code" },
  { name: "description", label: "Description", type: "textarea" },
];

export default function AffectationsClient() {
  return (
    <GenericCrudClient<Affectation>
      title="Affectations"
      icon="🏢"
      loader={(siteId) => getAffectations(siteId)}
      onAdd={addAffectation}
      onUpdate={updateAffectation}
      onDelete={deleteAffectation}
      fields={fields}
      columns={[
        { key: "nom", label: "Nom" },
        { key: "code", label: "Code" },
        { key: "description", label: "Description", render: (r) => r.description || "—" },
      ]}
      searchKeys={["nom", "code"]}
    />
  );
}
