import { Suspense } from "react";
import { getImpots, Impot } from "@/services/impots/impotService";
import ImpotServicesClient from "../components/ImpotServicesClient";
import ReproductionServicesClient from "../components/ReproductionServicesClient";
import VignetteServicesClient from "../components/VignetteServicesClient";
import AssuranceMotoServicesClient from "../components/AssuranceMotoServicesClient";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ImpotPageProps {
  params: Promise<{ id: string }>;
}

function ImpotIntrouvable({ id }: { id: string }) {
  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Impôt introuvable</p>
          <p className="text-sm mt-1">
            L&apos;impôt avec l&apos;identifiant <strong>#{id}</strong> n&apos;existe pas ou a été supprimé.{" "}
            <Link href="/activity/operations" className="underline font-medium hover:text-red-900">
              Retour aux opérations
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Composant pour le contenu principal
async function ImpotContent({ params }: ImpotPageProps) {
  const { id } = await params;
  const impotsResult = await getImpots();
  
  if (impotsResult.status === "error") {
    return <ImpotIntrouvable id={id} />;
  }
  
  const impots: Impot[] = impotsResult.data || [];
  const impot = impots.find((i) => i.id === parseInt(id));
  
  if (!impot) {
    return <ImpotIntrouvable id={id} />;
  }
  
  const parsedId = parseInt(id);

  if (parsedId === 12) {
    return <ReproductionServicesClient impot={impot} />;
  } else if (parsedId === 14) {
    return <VignetteServicesClient impot={impot} />;
  } else if (parsedId === 11) {
    return <ImpotServicesClient impot={impot} />;
  } else if (parsedId === 19) {
    return <AssuranceMotoServicesClient impot={impot} />;
  } else {
    return <ImpotIntrouvable id={id} />;
  }
}

// Composant principal
export default async function ImpotPage({ params }: ImpotPageProps) {
  const { id } = await params; // 👈 Déballer la Promise params ici aussi
  
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Chargement...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant le chargement des données.
            </p>
          </div>
        </div>
      }
    >
      <ImpotContent params={Promise.resolve({ id })} />
    </Suspense>
  );
}