"use client";
import { useState, useEffect } from "react";
import {
  Search,
  FileCheck,
  Printer,
  Eye,
  Car,
  User,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

// Données temporaires - à remplacer par votre API
const mockVehicles = [
  {
    id: 1,
    nom: "Jean Kabila",
    telephone: "+243 81 123 4567",
    adresse: "Commune de la Gombe, Kinshasa",
    plaque: "ABC123CD",
    marque: "Toyota",
    modele: "RAV4",
    couleur: "Noir",
    usage: "Particulier",
    energie: "Essence",
    anneeFab: 2019,
    anneeCirc: 2020,
    puissanceFiscal: "12 CV",
    chassis: "JTEBU5JRK85321546",
    moteur: "2AZ-FE3456789",
    dateControle: "2024-01-15",
    resultat: "Favorable",
    centre: "RFCK Centre 1",
    centre_adresse: "Avenue de la Libération, Gombe",
    centre_telephone: "+243 81 000 0000",
    centre_nom: "RFCK Centre 1",
    numero_vignette: "PV-2024-001",
    categorie: "M1",
    kilometrage: "45000",
    dmc: "2020",
    agent_nom: "Agent Technique 1",
    validite_vignette: "12",
    montantHT: 50.0,
  },
  {
    id: 2,
    nom: "Marie Lukusa",
    telephone: "+243 82 234 5678",
    adresse: "Commune de Ngaliema, Kinshasa",
    plaque: "XYZ789CD",
    marque: "Mercedes",
    modele: "C200",
    couleur: "Blanc",
    usage: "Professionnel",
    energie: "Diesel",
    anneeFab: 2018,
    anneeCirc: 2019,
    puissanceFiscal: "10 CV",
    chassis: "WDD2040021A123456",
    moteur: "OM654D23123456",
    dateControle: "2024-01-10",
    resultat: "Avec réserves",
    centre: "RFCK Centre 2",
    centre_adresse: "Boulevard du 30 Juin, Ngaliema",
    centre_telephone: "+243 82 111 1111",
    centre_nom: "RFCK Centre 2",
    numero_vignette: "PV-2024-002",
    categorie: "M1",
    kilometrage: "78000",
    dmc: "2019",
    agent_nom: "Agent Technique 2",
    validite_vignette: "12",
    montantHT: 50.0,
  },
  {
    id: 3,
    nom: "Paul Mbayo",
    telephone: "+243 83 345 6789",
    adresse: "Commune de Limete, Kinshasa",
    plaque: "DEF456CD",
    marque: "Ford",
    modele: "Ranger",
    couleur: "Bleu",
    usage: "Commercial",
    energie: "Diesel",
    anneeFab: 2020,
    anneeCirc: 2021,
    puissanceFiscal: "15 CV",
    chassis: "MFPEXXMJPH123456",
    moteur: "Duratorq2345678",
    dateControle: "2024-01-05",
    resultat: "Défavorable",
    centre: "RFCK Centre 3",
    centre_adresse: "Avenue Lumumba, Limete",
    centre_telephone: "+243 83 222 2222",
    centre_nom: "RFCK Centre 3",
    numero_vignette: "PV-2024-003",
    categorie: "N1",
    kilometrage: "32000",
    dmc: "2021",
    agent_nom: "Agent Technique 3",
    validite_vignette: "12",
    montantHT: 50.0,
  },
  {
    id: 4,
    nom: "Sophie Nzuzi",
    telephone: "+243 84 456 7890",
    adresse: "Commune de Bandal, Kinshasa",
    plaque: "GHI789CD",
    marque: "Honda",
    modele: "CR-V",
    couleur: "Rouge",
    usage: "Particulier",
    energie: "Essence",
    anneeFab: 2021,
    anneeCirc: 2022,
    puissanceFiscal: "13 CV",
    chassis: "7FARW2H59NE123456",
    moteur: "K24W71234567",
    dateControle: "2024-01-20",
    resultat: "Favorable",
    centre: "RFCK Centre 1",
    centre_adresse: "Avenue de la Libération, Gombe",
    centre_telephone: "+243 81 000 0000",
    centre_nom: "RFCK Centre 1",
    numero_vignette: "PV-2024-004",
    categorie: "M1",
    kilometrage: "15000",
    dmc: "2022",
    agent_nom: "Agent Technique 1",
    validite_vignette: "12",
    montantHT: 50.0,
  },
  {
    id: 5,
    nom: "David Kabasele",
    telephone: "+243 85 567 8901",
    adresse: "Commune de Kalamu, Kinshasa",
    plaque: "JKL012CD",
    marque: "BMW",
    modele: "X5",
    couleur: "Gris",
    usage: "Professionnel",
    energie: "Diesel",
    anneeFab: 2017,
    anneeCirc: 2018,
    puissanceFiscal: "18 CV",
    chassis: "WBANF71000C123456",
    moteur: "N57D30B123456",
    dateControle: "2024-01-18",
    resultat: "Favorable",
    centre: "RFCK Centre 2",
    centre_adresse: "Boulevard du 30 Juin, Ngaliema",
    centre_telephone: "+243 82 111 1111",
    centre_nom: "RFCK Centre 2",
    numero_vignette: "PV-2024-005",
    categorie: "M1",
    kilometrage: "95000",
    dmc: "2018",
    agent_nom: "Agent Technique 2",
    validite_vignette: "12",
    montantHT: 50.0,
  },
];

// Données de contrôle technique
const controleData = [
  { id: "1", nom: "État du volant", statut: "bon" },
  { id: "2", nom: "Pneus avant", statut: "usure moyenne" },
  { id: "3", nom: "Pneus arrière", statut: "bon" },
  { id: "4", nom: "Freins avant", statut: "excellent" },
  { id: "5", nom: "Freins arrière", statut: "bon" },
  { id: "6", nom: "Éclairage avant", statut: "à vérifier" },
  { id: "7", nom: "Éclairage arrière", statut: "bon" },
  { id: "8", nom: "Rétroviseurs", statut: "excellent" },
  { id: "9", nom: "Claxon", statut: "bon" },
  { id: "10", nom: "Chaîne/Courroie", statut: "usure légère" },
  { id: "11", nom: "Suspension", statut: "bon" },
  { id: "12", nom: "Tubulure d'échappement", statut: "bon" },
];

// Données des défauts
const mockDefauts = [
  { id: 1, description: "Pneus avant usés au-delà de la limite légale" },
  { id: 2, description: "Éclairage avant gauche défaillant" },
  { id: 3, description: "Niveau des plaquettes de frein insuffisant" },
];

// Données des mesures
const mockMesures = [
  { type_mesure: "freinage-avant", valeur: "85%" },
  { type_mesure: "freinage-arriere", valeur: "78%" },
  { type_mesure: "eclairage-phares", valeur: "1200 lumens" },
  { type_mesure: "eclairage-feux", valeur: "800 lumens" },
  { type_mesure: "suspension-avant", valeur: "Bon" },
  { type_mesure: "suspension-arriere", valeur: "Bon" },
  { type_mesure: "emission-co", valeur: "0.5%" },
  { type_mesure: "emission-hc", valeur: "100 ppm" },
  { type_mesure: "pneus-pression", valeur: "2.3 bar" },
  { type_mesure: "pneus-profondeur", valeur: "3.2 mm" },
];

export default function ControleTechniqueClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<
    (typeof mockVehicles)[0] | null
  >(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPvModal, setShowPvModal] = useState(false);
  const [filterResult, setFilterResult] = useState<string>("all");

  const filteredVehicles = mockVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.plaque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.telephone.includes(searchTerm);

    const matchesFilter =
      filterResult === "all" ||
      vehicle.resultat.toLowerCase() === filterResult.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const handleDetailClick = (vehicle: (typeof mockVehicles)[0]) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const handlePrintClick = (vehicle: (typeof mockVehicles)[0]) => {
    setSelectedVehicle(vehicle);
    setShowPvModal(true);
  };

  const getResultColor = (resultat: string) => {
    switch (resultat.toLowerCase()) {
      case "favorable":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "avec réserves":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "défavorable":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getResultIcon = (resultat: string) => {
    switch (resultat.toLowerCase()) {
      case "favorable":
        return <CheckCircle className="w-4 h-4 mr-1" />;
      case "avec réserves":
        return <AlertCircle className="w-4 h-4 mr-1" />;
      case "défavorable":
        return <XCircle className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Car className="w-8 h-8 mr-3 text-blue-600" />
                Liste des Contrôles Techniques
              </h1>
              <p className="text-gray-600 mt-2">
                Consultez et gérez les véhicules ayant effectué leur contrôle
                technique
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, plaque ou téléphone..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Résultat :
                </span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="favorable">Favorable</option>
                  <option value="avec réserves">Avec réserves</option>
                  <option value="défavorable">Défavorable</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <span className="text-sm text-gray-500">
                {filteredVehicles.length} véhicule
                {filteredVehicles.length !== 1 ? "s" : ""} trouvé
                {filteredVehicles.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Liste des véhicules */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Assujetti
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Contact & Véhicule
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Détails du Contrôle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-blue-50/50 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {vehicle.nom}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {vehicle.adresse}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {vehicle.telephone}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Car className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            <span className="font-semibold">
                              {vehicle.plaque}
                            </span>{" "}
                            • {vehicle.marque} {vehicle.modele}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-900 font-medium">
                          {new Date(vehicle.dateControle).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getResultColor(
                              vehicle.resultat,
                            )}`}
                          >
                            {getResultIcon(vehicle.resultat)}
                            {vehicle.resultat}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Centre: {vehicle.centre}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDetailClick(vehicle)}
                          className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Détail
                        </button>
                        <button
                          onClick={() => handlePrintClick(vehicle)}
                          className="inline-flex items-center px-4 py-2 border border-emerald-300 text-sm font-medium rounded-lg text-emerald-700 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Imprimer PV
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-emerald-800 font-bold text-2xl">
                  {
                    mockVehicles.filter((v) => v.resultat === "Favorable")
                      .length
                  }
                </div>
                <div className="text-emerald-600 text-sm mt-1">Favorables</div>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-amber-800 font-bold text-2xl">
                  {
                    mockVehicles.filter((v) => v.resultat === "Avec réserves")
                      .length
                  }
                </div>
                <div className="text-amber-600 text-sm mt-1">Avec réserves</div>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-800 font-bold text-2xl">
                  {
                    mockVehicles.filter((v) => v.resultat === "Défavorable")
                      .length
                  }
                </div>
                <div className="text-red-600 text-sm mt-1">Défavorables</div>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-800 font-bold text-2xl">
                  {mockVehicles.length}
                </div>
                <div className="text-blue-600 text-sm mt-1">
                  Total véhicules
                </div>
              </div>
              <Car className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Détails */}
      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Détails du Véhicule
                </h2>
                <p className="text-gray-600">
                  Informations complètes de l'assujetti et de l'engin
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations de l'assujetti */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    Informations de l'Assujetti
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Nom complet
                      </label>
                      <div className="text-gray-900 font-medium">
                        {selectedVehicle.nom}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Téléphone
                      </label>
                      <div className="text-gray-900">
                        {selectedVehicle.telephone}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Adresse
                      </label>
                      <div className="text-gray-900">
                        {selectedVehicle.adresse}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations de l'engin */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                      <Car className="w-5 h-5 text-emerald-600" />
                    </div>
                    Informations de l'Engin
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Numéro de plaque
                      </label>
                      <div className="text-gray-900 font-bold text-lg">
                        {selectedVehicle.plaque}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                          Marque/Modèle
                        </label>
                        <div className="text-gray-900">
                          {selectedVehicle.marque} {selectedVehicle.modele}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                          Couleur
                        </label>
                        <div className="text-gray-900">
                          {selectedVehicle.couleur}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                          Usage
                        </label>
                        <div className="text-gray-900">
                          {selectedVehicle.usage}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                          Énergie
                        </label>
                        <div className="text-gray-900">
                          {selectedVehicle.energie}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Résultats du contrôle technique */}
                <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <div className="p-2 bg-amber-100 rounded-lg mr-3">
                      <FileCheck className="w-5 h-5 text-amber-600" />
                    </div>
                    Résultats du Contrôle Technique
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {controleData.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {item.nom}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              item.statut === "excellent"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.statut === "bon"
                                  ? "bg-blue-100 text-blue-800"
                                  : item.statut === "usure légère"
                                    ? "bg-amber-100 text-amber-800"
                                    : item.statut === "usure moyenne"
                                      ? "bg-orange-100 text-orange-800"
                                      : item.statut === "à vérifier"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.statut}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowPvModal(true);
                  }}
                  className="px-5 py-2.5 border border-blue-600 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all flex items-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer PV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal PV */}
      {showPvModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Procès-Verbal de Contrôle Technique
                </h2>
                <p className="text-gray-600">Document officiel à imprimer</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </button>
                <button
                  onClick={() => setShowPvModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu du PV - Copie exacte du template PHP */}
            <div className="p-8">
              <style jsx>{`
                @import url("https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700&display=swap");

                .pv-container {
                  font-family: "Saira", sans-serif;
                  box-sizing: border-box;
                  width: 210mm;
                  min-height: 297mm;
                  margin: 0 auto;
                  font-size: 12px;
                  position: relative;
                  background-color: #fff;
                  padding: 20px;
                  border: 1px solid #e5e7eb;
                }

                .entete {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 15px;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                }

                .entete span {
                  display: flex;
                  flex-direction: column;
                }

                .entete b {
                  font-size: 10px;
                  font-weight: 600;
                }

                .entete span span {
                  font-size: 11px;
                }

                .logo-provincial {
                  height: 50px;
                  position: absolute;
                  left: 20px;
                  top: 10px;
                }

                .logo-rfck {
                  height: 50px;
                  position: absolute;
                  right: 20px;
                  top: 10px;
                }

                .title {
                  text-align: center;
                  margin-bottom: 20px;
                }

                .title p {
                  font-size: 11px;
                  line-height: 1.4;
                }

                .title h3 {
                  font-size: 14px;
                  text-transform: uppercase;
                  font-weight: 700;
                  margin: 5px 0;
                  padding: 5px 0;
                  border-top: 2px solid #000;
                  border-bottom: 2px solid #000;
                }

                .content-wrapper {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 20px;
                  gap: 20px;
                }

                .content-box {
                  width: 48%;
                  display: flex;
                  flex-direction: column;
                }

                .info-line {
                  display: flex;
                  justify-content: space-between;
                  margin: 4px 0;
                }

                .info-line b {
                  font-size: 11px;
                  font-weight: 600;
                  width: 45%;
                }

                .info-line span {
                  font-size: 11px;
                  width: 55%;
                  text-align: right;
                }

                .info-block {
                  border: 1px solid #000;
                  padding: 10px;
                  margin-bottom: 10px;
                  flex-grow: 1;
                }

                .defects-block {
                  border: 1px solid #000;
                  padding: 10px;
                  margin-bottom: 10px;
                }

                .defects-title {
                  font-weight: 700;
                  font-size: 12px;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  text-align: center;
                  border-bottom: 1px solid #000;
                  padding-bottom: 3px;
                }

                .defects-list {
                  padding-left: 15px;
                }

                .defects-list p {
                  margin: 3px 0;
                }

                .result-block {
                  border: 1px solid #000;
                  padding: 10px;
                  margin-bottom: 10px;
                }

                .result-line {
                  display: flex;
                  justify-content: space-between;
                  margin: 5px 0;
                }

                .measurement-block {
                  border: 1px solid #000;
                  padding: 10px;
                  margin-bottom: 10px;
                }

                .measurement-title {
                  font-weight: 700;
                  font-size: 12px;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  text-align: center;
                  border-bottom: 1px solid #000;
                  padding-bottom: 3px;
                }

                .measurement-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 5px;
                  font-size: 11px;
                }

                .measurement-table th {
                  background-color: #f2f2f2;
                  text-align: left;
                  padding: 3px 5px;
                  font-weight: 600;
                }

                .measurement-table td {
                  padding: 3px 5px;
                  border-bottom: 1px solid #ddd;
                }

                sup {
                  font-size: smaller;
                  vertical-align: super;
                }

                .client-block {
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                }

                .qr-code-container {
                  margin-top: auto;
                  text-align: center;
                  padding: 15px;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  max-width: 180px;
                  align-self: center;
                }

                .qr-code {
                  width: 120px;
                  height: 120px;
                  margin: 0 auto;
                  padding: 5px;
                  background-color: white;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                }

                .qr-code-label {
                  margin-top: 10px;
                  font-size: 10px;
                  font-weight: bold;
                  color: #333;
                }

                .qr-code-footer {
                  font-size: 9px;
                  color: #666;
                  margin-top: 5px;
                }

                .qr-code-center {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  position: relative;
                }

                .qr-code-logo {
                  width: 20px;
                  height: 20px;
                  position: absolute;
                  top: 34%;
                  left: 44%;
                  transform: translate(-30%, -50%);
                  background-color: white;
                  padding: 3px;
                  border-radius: 4px;
                }

                .footer {
                  margin-top: 20px;
                  font-size: 10px;
                  text-align: center;
                  color: #666;
                  border-top: 1px solid #000;
                  padding-top: 10px;
                }

                .signatures {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 30px;
                  padding-top: 15px;
                  border-top: 1px solid #000;
                }

                .signature {
                  text-align: center;
                  width: 30%;
                }

                .signature-line {
                  border-top: 1px solid #000;
                  margin: 5px auto;
                  width: 80%;
                  height: 1px;
                }

                .signature-title {
                  font-size: 10px;
                  font-weight: bold;
                  margin-top: 20px;
                }

                .signature-name {
                  font-size: 9px;
                  margin-top: 5px;
                }

                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .pv-container,
                  .pv-container * {
                    visibility: visible;
                  }
                  .pv-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    border: none;
                    box-shadow: none;
                  }
                }
              `}</style>

              <div className="pv-container">
                <div className="title">
                  <p>
                    REPUBLIQUE DEMOCRATIQUE DU CONGO <br />
                    Ville Province De Kinshasa <br />
                    Ministère Provincial des Transports et Mobilité Urbaine
                  </p>
                  <h3>
                    REGIE DES FOURRIERES ET DE CONTROLE TECHNIQUE <br /> DES
                    VEHICULES DE KINSHASA
                  </h3>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-left">
                      <b>Nom centre :</b>
                      <span>{selectedVehicle.centre_nom}</span>
                    </div>
                    <div className="text-center">
                      <b>Adresse :</b>
                      <span>{selectedVehicle.centre_adresse}</span>
                    </div>
                    <div className="text-right">
                      <b>Numéro telephone :</b>
                      <span>{selectedVehicle.centre_telephone}</span>
                    </div>
                  </div>
                </div>

                <div className="content-wrapper">
                  {/* Colonne de gauche */}
                  <div className="content-box">
                    {/* Bloc en-tête */}
                    <div className="info-block">
                      <div className="info-line">
                        <b>
                          N<sup>O</sup> PV / SHEET N<sup>O</sup> :
                        </b>
                        <span>{selectedVehicle.numero_vignette}</span>
                      </div>
                      <div className="info-line">
                        <b>Date du control / Date of control :</b>
                        <span>
                          {new Date(
                            selectedVehicle.dateControle,
                          ).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>

                    {/* Bloc info véhicule */}
                    <div className="info-block">
                      <div className="info-line">
                        <b>Immatriculation / reg.Number :</b>
                        <span>{selectedVehicle.plaque}</span>
                      </div>
                      <div className="info-line">
                        <b>Marque / Brand :</b>
                        <span>{selectedVehicle.marque}</span>
                      </div>
                      <div className="info-line">
                        <b>Type / Model :</b>
                        <span>{selectedVehicle.modele}</span>
                      </div>
                      <div className="info-line">
                        <b>N.chassis / Chassis N. :</b>
                        <span>{selectedVehicle.chassis}</span>
                      </div>
                      <div className="info-line">
                        <b>Energie / Energy :</b>
                        <span>{selectedVehicle.energie}</span>
                      </div>
                      <div className="info-line">
                        <b>DMC / Date of first use :</b>
                        <span>{selectedVehicle.dmc}</span>
                      </div>
                      <div className="info-line">
                        <b>Kilométrage / Mileage :</b>
                        <span>{selectedVehicle.kilometrage} km</span>
                      </div>
                    </div>

                    {/* Bloc défauts */}
                    <div className="defects-block">
                      <div className="defects-title">
                        Défauts à réparer / Defects to be repaired
                      </div>
                      <div className="defects-list">
                        {mockDefauts.map((defaut, index) => (
                          <p key={defaut.id}>
                            {index + 1}. {defaut.description}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Bloc résultat */}
                    <div className="result-block">
                      <div className="result-line">
                        <span>
                          <b>Résultat du control / Control result :</b>
                        </span>
                        <span>
                          {selectedVehicle.resultat === "Favorable" &&
                            "ACCEPTED / Accepté"}
                          {selectedVehicle.resultat === "Défavorable" &&
                            "REJECTED / Rejeté"}
                          {selectedVehicle.resultat === "Avec réserves" &&
                            "ACCEPTED WITH RESERVES / Accepté avec réserves"}
                        </span>
                      </div>
                      <div className="result-line">
                        <span>
                          <b>Prochaine visite :</b>
                        </span>
                        <span>
                          {(() => {
                            const date = new Date(selectedVehicle.dateControle);
                            date.setMonth(
                              date.getMonth() +
                                parseInt(selectedVehicle.validite_vignette),
                            );
                            return date.toLocaleDateString("fr-FR");
                          })()}
                        </span>
                      </div>
                      <div className="result-line">
                        <span>
                          <b>Vignette :</b>
                        </span>
                        <span>{selectedVehicle.numero_vignette}</span>
                      </div>
                      <div className="result-line">
                        <span>
                          <b>Agent :</b>
                        </span>
                        <span>{selectedVehicle.agent_nom}</span>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="qr-code-container">
                      <div className="qr-code-center">
                        <div className="qr-code">
                          {/* QR Code serait généré ici en production */}
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-xs font-bold">QR CODE</div>
                              <div className="text-[10px] mt-1">
                                {selectedVehicle.numero_vignette}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="qr-code-logo">
                          <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="#0066cc"
                            strokeWidth="2"
                          >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                          </svg>
                        </div>
                        <div className="qr-code-label">
                          VERIFICATION DU DOCUMENT
                        </div>
                        <div className="qr-code-footer">
                          Scan this QR code to verify
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Colonne de droite */}
                  <div className="content-box">
                    {/* Bloc type de contrôle */}
                    <div className="info-block">
                      <div className="info-line">
                        <b>Type de control / Control type :</b>
                        <span>Contrôle Initial</span>
                      </div>
                      <div className="info-line">
                        <b>Catégorie / Category :</b>
                        <span>{selectedVehicle.categorie}</span>
                      </div>
                    </div>

                    {/* Bloc client */}
                    <div className="info-block">
                      <div className="client-block">
                        <div>
                          <div className="info-line">
                            <b>Client / Customer :</b>
                            <span>{selectedVehicle.nom}</span>
                          </div>
                          <div className="info-line">
                            <b>Adresse / Address :</b>
                            <span>{selectedVehicle.adresse}</span>
                          </div>
                        </div>
                        <div>
                          <div className="info-line">
                            <b>Montant payé HT / Amount ex.VAT :</b>
                            <span>{selectedVehicle.montantHT.toFixed(2)}</span>
                          </div>
                          <div className="info-line">
                            <b>TVA / VAT :</b>
                            <span>16.00%</span>
                          </div>
                          <div className="info-line">
                            <b>Montant payé TTC / Amount inc. VAT :</b>
                            <span>
                              {(selectedVehicle.montantHT * 1.16).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloc mesures */}
                    <div className="measurement-block">
                      <div className="measurement-title">
                        RELEVE DES MESURES / MEASUREMENT
                      </div>
                      <table className="measurement-table">
                        {/* Organiser les mesures par catégorie */}
                        {(() => {
                          const mesuresOrganisees: Record<string, any[]> = {};
                          mockMesures.forEach((mesure) => {
                            const type = mesure.type_mesure.split("-")[0];
                            if (!mesuresOrganisees[type]) {
                              mesuresOrganisees[type] = [];
                            }
                            mesuresOrganisees[type].push(mesure);
                          });

                          return Object.entries(mesuresOrganisees).map(
                            ([categorie, mesuresCategorie]) => {
                              let titre = categorie.toUpperCase();
                              if (categorie === "freinage")
                                titre = "FREINS / BRAKES";
                              else if (categorie === "eclairage")
                                titre = "PHARES / LAMPS";
                              else if (categorie === "suspension")
                                titre = "SUSPENSION";
                              else if (categorie === "emission")
                                titre = "EMISSIONS";
                              else if (categorie === "pneus")
                                titre = "PNEUS / TIRES";

                              return (
                                <tbody key={categorie}>
                                  <tr>
                                    <th colSpan={2}>{titre}</th>
                                  </tr>
                                  {mesuresCategorie.map((mesure) => (
                                    <tr key={mesure.type_mesure}>
                                      <td>
                                        {(() => {
                                          const parts =
                                            mesure.type_mesure.split("-");
                                          if (parts.length < 2)
                                            return mesure.type_mesure;

                                          return parts[1]
                                            .split("_")
                                            .map(
                                              (word: string) =>
                                                word.charAt(0).toUpperCase() +
                                                word.slice(1),
                                            )
                                            .join(" ");
                                        })()}
                                      </td>
                                      <td>{mesure.valeur}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              );
                            },
                          );
                        })()}
                      </table>
                    </div>

                    {/* Espace supplémentaire pour aligner avec QR code */}
                    <div style={{ flexGrow: 1 }}></div>
                  </div>
                </div>

                {/* Section des signatures */}
                <div className="signatures">
                  <div className="signature">
                    <div className="signature-title">
                      DIVISION URBAINE DES TRANSPORTS
                    </div>
                    <div className="signature-line"></div>
                    <div className="signature-name">Nom & Signature</div>
                  </div>
                  <div className="signature">
                    <div className="signature-title">RFCK</div>
                    <div className="signature-line"></div>
                    <div className="signature-name">Nom & Signature</div>
                  </div>
                  <div className="signature">
                    <div className="signature-title">CENTRE TECHNIQUE</div>
                    <div className="signature-line"></div>
                    <div className="signature-name">TSC-NPS</div>
                  </div>
                </div>

                <div className="footer">
                  Document officiel du Ministère des Transports - Toute
                  falsification est punie par la loi
                  <br />
                  Généré automatiquement le{" "}
                  {new Date().toLocaleDateString("fr-FR")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
