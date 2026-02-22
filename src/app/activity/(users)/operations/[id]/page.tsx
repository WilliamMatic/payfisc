import { Suspense } from "react";
import { getImpots, Impot } from "@/services/impots/impotService";
import ImpotServicesClient from "../components/ImpotServicesClient";
import ReproductionServicesClient from "../components/ReproductionServicesClient";
import VignetteServicesClient from "../components/VignetteServicesClient";

// Required for dynamic routes - no prerender
export function generateStaticParams() {
  return [{ id: "0" }];
}

interface ImpotPageProps {
  params: Promise<{ id: string }>;
}

// Composant pour le contenu principal
async function ImpotContent({ params }: ImpotPageProps) {
  const { id } = await params; // 👈 Déballer la Promise params
  const impotsResult = await getImpots();
  
  if (impotsResult.status === "error") {
    throw new Error(impotsResult.message);
  }
  
  const impots: Impot[] = impotsResult.data || [];
  const impot = impots.find((i) => i.id === parseInt(id));
  
  if (!impot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Impôt non trouvé
          </h1>
          <p className="text-gray-600">
            L'impôt que vous recherchez n'existe pas.
          </p>
        </div>
      </div>
    );
  }
  
  const parsedId = parseInt(id);

  if (parsedId === 12) {
    return <ReproductionServicesClient impot={impot} />;
  } else if (parsedId === 14) {
    return <VignetteServicesClient impot={impot} />;
  } else if (parsedId === 11) {
    return <ImpotServicesClient impot={impot} />;
  } else {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          maxWidth: "500px",
          margin: "40px auto",
        }}
      >
        <h2 style={{ color: "#e11d48", marginBottom: "10px" }}>
          Service non trouvé
        </h2>
        <p style={{ color: "#555" }}>
          Le service demandé n'existe pas ou n'est pas encore configuré.
        </p>
      </div>
    );
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