import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Header() {
  const router = useRouter();
  return (
    <div className="mb-8 flex items-center justify-between">
      
      {/* Titre et description */}
      <div>
        <button
        type="button"
        onClick={() => router.back()}
        className="p-2 text-[#2D5B7A] hover:text-[#244D68] hover:bg-[#2D5B7A]/10 rounded-lg transition-colors flex items-center justify-center"
        title="Retour"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Retour aux services</span>
      </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Achats des Grossistes
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Suivi et gestion des achats groupés de plaques d'immatriculation
        </p>
      </div>

      {/* Bouton à droite */}
      <Link
        href="achats-grossistes/suppression-vente-grossiste/"
        className="inline-block px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
      >
        Supprimer une vente
      </Link>
    </div>
  );
}
