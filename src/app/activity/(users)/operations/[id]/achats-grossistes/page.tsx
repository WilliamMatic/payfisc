import { Metadata } from "next";
import AchatsGrossistesClient from "./AchatsGrossistesClient";

export const metadata: Metadata = {
  title: "Achats Grossistes | PayFisc",
  description: "Suivi et gestion des achats groupés de plaques d'immatriculation",
};

export default function AchatsGrossistesPage() {
  return <AchatsGrossistesClient />;
}