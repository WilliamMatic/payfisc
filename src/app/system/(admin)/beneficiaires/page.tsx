import {
  getBeneficiaires,
  Beneficiaire as BeneficiaireType,
} from "@/services/beneficiaires/beneficiaireService";
import BeneficiaireClient from "./components/BeneficiaireClient";

export default async function BeneficiairesPage() {
  try {
    const beneficiairesResult = await getBeneficiaires();

    // Vérification et nettoyage des données bénéficiaires
    const beneficiaires: BeneficiaireType[] =
      beneficiairesResult.status === "success"
        ? (beneficiairesResult.data || []).filter(
            (
              beneficiaire: BeneficiaireType | null | undefined
            ): beneficiaire is BeneficiaireType =>
              beneficiaire !== null && beneficiaire !== undefined
          )
        : [];

    // Gestion des erreurs
    const error: string | null =
      beneficiairesResult.status === "error"
        ? beneficiairesResult.message ?? "Erreur inconnue"
        : null;

    return (
      <BeneficiaireClient
        initialBeneficiaires={beneficiaires}
        initialError={error}
      />
    );
  } catch (error) {
    console.error("Error loading beneficiaires:", error);
    return (
      <BeneficiaireClient
        initialBeneficiaires={[]}
        initialError="Erreur lors du chargement des bénéficiaires"
      />
    );
  }
}
