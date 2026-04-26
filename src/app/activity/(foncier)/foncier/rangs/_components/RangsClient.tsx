"use client";
import GenericCrudClient, { GenericField } from "../../_shared/GenericCrudClient";
import { getRangs, addRang, updateRang, deleteRang } from "@/services/foncier/foncierService";
import { RangFiscal } from "@/services/foncier/types";

const fields: GenericField[] = [
  { name: "nom", label: "Nom du rang", required: true, placeholder: "Ex: 1er rang" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "ordre", label: "Ordre", type: "number", placeholder: "1" },
];

export default function RangsClient() {
  return (
    <GenericCrudClient<RangFiscal>
      title="Rangs fiscaux"
      icon="🏷️"
      loader={(siteId) => getRangs(siteId)}
      onAdd={addRang}
      onUpdate={updateRang}
      onDelete={deleteRang}
      fields={fields}
      columns={[
        { key: "ordre", label: "#" },
        { key: "nom", label: "Rang" },
        { key: "description", label: "Description", render: (r) => r.description || "—" },
      ]}
      searchKeys={["nom"]}
    />
  );
}
