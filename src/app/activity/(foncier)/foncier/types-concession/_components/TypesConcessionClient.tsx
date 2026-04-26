"use client";
import GenericCrudClient, { GenericField } from "../../_shared/GenericCrudClient";
import { getTypesConcession, addTypeConcession, updateTypeConcession, deleteTypeConcession } from "@/services/foncier/foncierService";
import { TypeConcession } from "@/services/foncier/types";

const fields: GenericField[] = [
  { name: "nom", label: "Nom", required: true, placeholder: "Bâti / Non bâti" },
  { name: "code", label: "Code", placeholder: "BATI / NON_BATI" },
  { name: "description", label: "Description", type: "textarea" },
];

export default function TypesConcessionClient() {
  return (
    <GenericCrudClient<TypeConcession>
      title="Types de concession"
      icon="🏗️"
      loader={(siteId) => getTypesConcession(siteId)}
      onAdd={addTypeConcession}
      onUpdate={updateTypeConcession}
      onDelete={deleteTypeConcession}
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
