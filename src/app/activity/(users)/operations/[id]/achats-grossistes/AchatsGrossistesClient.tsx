"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Lock, ArrowLeft, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAchatsGrossistes,
  fetchStatistiquesAchats,
  exportAchats,
  applyAchatsFilters,
  resetAchatsFilters,
  type ServerActionResponse,
} from "@/app/actions/achats-grossistes";
import { type FiltreAchats } from "@/services/achats/grossisteAchatService";
import Header from "./components/Header";
import Statistiques from "./components/Statistiques";
import Filtres from "./components/Filtres";
import Resultats from "./components/Resultats";
import VoirPlaquesModal from "./components/VoirPlaquesModal";
import {
  AchatPlaques,
  GroupedAchats,
  Statistiques as StatistiquesType,
  ViewMode,
} from "./types";

export default function AchatsGrossistesClient() {
  const params = useParams();
  const router = useRouter();
  const impotId = params.id as string;
  const { utilisateur, isLoading: authLoading } = useAuth();

  // États
  const [achats, setAchats] = useState<AchatPlaques[]>([]);
  const [filteredAchats, setFilteredAchats] = useState<AchatPlaques[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistiques, setStatistiques] = useState<StatistiquesType | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  // Filtres
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [recherche, setRecherche] = useState<string>("");
  const [selectedPlaque, setSelectedPlaque] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [parsedPrivileges, setParsedPrivileges] = useState<any>(null);

  // Modal pour afficher toutes les plaques
  const [showPlaquesModal, setShowPlaquesModal] = useState(false);
  const [selectedAchatForModal, setSelectedAchatForModal] =
    useState<AchatPlaques | null>(null);

  // Parser les privilèges quand utilisateur change
  useEffect(() => {
    if (utilisateur?.privileges_include) {
      try {
        const parsed = JSON.parse(utilisateur.privileges_include);
        setParsedPrivileges(parsed);
      } catch (error) {
        console.error("Erreur parsing privileges:", error);
        setParsedPrivileges({});
      }
    } else if (utilisateur) {
      setParsedPrivileges({});
    }
  }, [utilisateur]);

  // Charger les données initiales (achats du jour)
  const chargerDonnees = async (filtres?: FiltreAchats) => {
    try {
      setLoading(true);
      setError(null);

      const response: ServerActionResponse = await fetchAchatsGrossistes(
        filtres
      );

      if (!response.success) {
        throw new Error(response.message);
      }

      const achatsData = response.data || [];

      const formattedAchats: AchatPlaques[] = achatsData.map((achat: any) => ({
        id: achat.id,
        assujetti_id: achat.particulier_id,
        assujetti: {
          id: achat.particulier_id,
          nom: achat.grossiste.nom,
          prenom: achat.grossiste.prenom,
          telephone: achat.grossiste.telephone,
          adresse: achat.grossiste.adresse,
          nif: achat.grossiste.nif,
          email: achat.grossiste.email,
          ville: achat.grossiste.ville,
          province: achat.grossiste.province,
        },
        date_achat: achat.date_achat,
        nombre_plaques: achat.nombre_plaques,
        type_plaque: achat.type_plaque,
        serie_debut: achat.serie_debut,
        serie_fin: achat.serie_fin,
        montant_total: achat.montant_total,
        statut: achat.statut,
        plaques: achat.plaques,
        plaques_detail: achat.plaques_detail || [],
        impot_id: achat.impot_id,
        mode_paiement: achat.mode_paiement,
      }));

      setAchats(formattedAchats);
      setFilteredAchats(formattedAchats);

      if (filtres?.dateDebut || filtres?.dateFin) {
        const responseStats = await fetchStatistiquesAchats(
          filtres.dateDebut,
          filtres.dateFin
        );

        if (responseStats.success) {
          setStatistiques(responseStats.data);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des données"
      );
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage initial
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    chargerDonnees({
      dateDebut: today,
      dateFin: today,
    });
  }, []);

  // Grouper les achats par date
  const achatsGroupes = useMemo<GroupedAchats[]>(() => {
    if (viewMode === "list") return [];

    const grouped: Record<string, GroupedAchats> = {};

    filteredAchats.forEach((achat) => {
      if (!grouped[achat.date_achat]) {
        grouped[achat.date_achat] = {
          date: achat.date_achat,
          achats: [],
          totalPlaques: 0,
          totalMontant: 0,
        };
      }
      grouped[achat.date_achat].achats.push(achat);
      grouped[achat.date_achat].totalPlaques += achat.nombre_plaques;
      grouped[achat.date_achat].totalMontant += achat.montant_total;
    });

    return Object.values(grouped).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredAchats, viewMode]);

  // Formater la date en français
  const formaterDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  // Formater la date longue
  const formaterDateLongue = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE dd MMMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  // Gérer l'affichage des séries de plaques
  const formaterSeriePlaques = (achat: AchatPlaques) => {
    if (achat.nombre_plaques <= 5) {
      return achat.plaques.join(", ");
    } else {
      return `${achat.serie_debut} → ${achat.serie_fin}`;
    }
  };

  // Toggle l'expansion d'une date
  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Appliquer les filtres avec Server Action
  const appliquerFiltres = async () => {
    startTransition(async () => {
      try {
        setLoading(true);

        const formData = new FormData();
        if (dateDebut) formData.append("dateDebut", dateDebut);
        if (dateFin) formData.append("dateFin", dateFin);
        if (recherche) formData.append("recherche", recherche);
        if (selectedPlaque) formData.append("plaque", selectedPlaque);

        const response: ServerActionResponse = await applyAchatsFilters(
          formData
        );

        if (!response.success) {
          throw new Error(response.message);
        }

        const achatsData = response.data || [];

        const formattedAchats: AchatPlaques[] = achatsData.map(
          (achat: any) => ({
            id: achat.id,
            assujetti_id: achat.particulier_id,
            assujetti: {
              id: achat.particulier_id,
              nom: achat.grossiste.nom,
              prenom: achat.grossiste.prenom,
              telephone: achat.grossiste.telephone,
              adresse: achat.grossiste.adresse,
              nif: achat.grossiste.nif,
              email: achat.grossiste.email,
              ville: achat.grossiste.ville,
              province: achat.grossiste.province,
            },
            date_achat: achat.date_achat,
            nombre_plaques: achat.nombre_plaques,
            type_plaque: achat.type_plaque,
            serie_debut: achat.serie_debut,
            serie_fin: achat.serie_fin,
            montant_total: achat.montant_total,
            statut: achat.statut,
            plaques: achat.plaques,
            plaques_detail: achat.plaques_detail || [],
            impot_id: achat.impot_id,
            mode_paiement: achat.mode_paiement,
          })
        );

        setAchats(formattedAchats);
        setFilteredAchats(formattedAchats);

        const responseStats = await fetchStatistiquesAchats(dateDebut, dateFin);
        if (responseStats.success) {
          setStatistiques(responseStats.data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de l'application des filtres"
        );
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    });
  };

  // Réinitialiser les filtres avec Server Action
  const reinitialiserFiltres = async () => {
    startTransition(async () => {
      try {
        setDateDebut("");
        setDateFin("");
        setRecherche("");
        setSelectedPlaque("");

        const response: ServerActionResponse = await resetAchatsFilters();

        if (!response.success) {
          throw new Error(response.message);
        }

        const achatsData = response.data || [];

        const formattedAchats: AchatPlaques[] = achatsData.map(
          (achat: any) => ({
            id: achat.id,
            assujetti_id: achat.particulier_id,
            assujetti: {
              id: achat.particulier_id,
              nom: achat.grossiste.nom,
              prenom: achat.grossiste.prenom,
              telephone: achat.grossiste.telephone,
              adresse: achat.grossiste.adresse,
              nif: achat.grossiste.nif,
              email: achat.grossiste.email,
              ville: achat.grossiste.ville,
              province: achat.grossiste.province,
            },
            date_achat: achat.date_achat,
            nombre_plaques: achat.nombre_plaques,
            type_plaque: achat.type_plaque,
            serie_debut: achat.serie_debut,
            serie_fin: achat.serie_fin,
            montant_total: achat.montant_total,
            statut: achat.statut,
            plaques: achat.plaques,
            plaques_detail: achat.plaques_detail || [],
            impot_id: achat.impot_id,
            mode_paiement: achat.mode_paiement,
          })
        );

        setAchats(formattedAchats);
        setFilteredAchats(formattedAchats);
        setStatistiques(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de la réinitialisation"
        );
        console.error("Erreur:", err);
      }
    });
  };

  // Exporter les données avec Server Action
  const exporterDonnees = async () => {
    startTransition(async () => {
      try {
        const filtres: FiltreAchats = {};

        if (dateDebut) filtres.dateDebut = dateDebut;
        if (dateFin) filtres.dateFin = dateFin;
        if (recherche) filtres.recherche = recherche;
        if (selectedPlaque) filtres.plaque = selectedPlaque;

        const result = await exportAchats(filtres, "csv");

        if (!result.success) {
          setError(result.message || "Erreur lors de l'exportation");
        }
      } catch (err) {
        setError("Erreur lors de l'exportation des données");
        console.error("Erreur:", err);
      }
    });
  };

  // Afficher toutes les plaques d'un achat
  const afficherToutesPlaques = (achat: AchatPlaques) => {
    setSelectedAchatForModal(achat);
    setShowPlaquesModal(true);
  };

  // Calculer les totaux
  const totalPlaques = useMemo(
    () => filteredAchats.reduce((sum, a) => sum + a.nombre_plaques, 0),
    [filteredAchats]
  );

  const totalMontant = useMemo(
    () => filteredAchats.reduce((sum, a) => sum + a.montant_total, 0),
    [filteredAchats]
  );

  if (loading && achats.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Chargement...</h2>
          <p className="text-gray-600">Récupération des données d'achats</p>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a le privilège "special"
  if (!parsedPrivileges?.special) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Accès Refusé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les privilèges nécessaires pour accéder à cette
              fonctionnalité.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <div className="text-left bg-gray-50 p-3 rounded-lg">
                <div className="font-medium mb-2">Vos privilèges:</div>
                {Object.entries(parsedPrivileges || {}).map(
                  ([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          value ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="font-medium">{key}:</span>
                      <span
                        className={value ? "text-green-600" : "text-red-600"}
                      >
                        {value ? "Activé" : "Désactivé"}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && achats.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              chargerDonnees({
                dateDebut: today,
                dateFin: today,
              });
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Header />

        <Statistiques
          totalAchats={filteredAchats.length}
          totalPlaques={totalPlaques}
          totalMontant={totalMontant}
        />

        <Filtres
          dateDebut={dateDebut}
          setDateDebut={setDateDebut}
          dateFin={dateFin}
          setDateFin={setDateFin}
          recherche={recherche}
          setRecherche={setRecherche}
          selectedPlaque={selectedPlaque}
          setSelectedPlaque={setSelectedPlaque}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isPending={isPending}
          loading={loading}
          appliquerFiltres={appliquerFiltres}
          reinitialiserFiltres={reinitialiserFiltres}
          exporterDonnees={exporterDonnees}
        />

        <Resultats
          filteredAchats={filteredAchats}
          achatsGroupes={achatsGroupes}
          viewMode={viewMode}
          expandedDates={expandedDates}
          isPending={isPending}
          loading={loading}
          formaterDate={formaterDate}
          formaterDateLongue={formaterDateLongue}
          formaterSeriePlaques={formaterSeriePlaques}
          toggleDateExpansion={toggleDateExpansion}
          afficherToutesPlaques={afficherToutesPlaques}
        />
      </div>

      <VoirPlaquesModal
        showPlaquesModal={showPlaquesModal}
        setShowPlaquesModal={setShowPlaquesModal}
        selectedAchatForModal={selectedAchatForModal}
      />
    </div>
  );
}
