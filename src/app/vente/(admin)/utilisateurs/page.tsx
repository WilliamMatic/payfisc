"use client";
import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Save,
  X,
  MapPin,
  Phone,
  User,
  Loader2,
} from "lucide-react";
import Portal from "../components/Portal";
import {
  Utilisateur as UtilisateurType,
  Site,
  getUtilisateurs,
  addUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  toggleUtilisateurStatus,
  getSitesActifs,
} from "../../../services/utilisateurs/utilisateurService";

export default function UsersPage() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurType[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUtilisateur, setSelectedUtilisateur] =
    useState<UtilisateurType | null>(null);
  const [formData, setFormData] = useState({
    nom_complet: "",
    telephone: "",
    adresse: "",
    site_affecte_id: 0,
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Chargement initial des utilisateurs et sites
  useEffect(() => {
    loadUtilisateurs();
    loadSites();
  }, []);

  const loadUtilisateurs = async () => {
    try {
      setLoading(true);
      const result = await getUtilisateurs();

      if (result.status === "success") {
        setUtilisateurs(result.data);
        setError(null);
      } else {
        setError(
          result.message || "Erreur lors du chargement des utilisateurs"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur lors du chargement des utilisateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const result = await getSitesActifs();

      if (result.status === "success") {
        setSites(result.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des sites:", err);
    }
  };

  const filteredUtilisateurs = utilisateurs.filter(
    (utilisateur) =>
      utilisateur.nom_complet
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      utilisateur.telephone.includes(searchTerm) ||
      utilisateur.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utilisateur.site_nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUtilisateur = async () => {
    if (
      !formData.nom_complet ||
      !formData.telephone ||
      !formData.site_affecte_id ||
      formData.site_affecte_id === 0
    ) {
      setError("Le nom complet, le téléphone et le site sont obligatoires");
      return;
    }

    setProcessing(true);
    try {
      const result = await addUtilisateur(formData);

      if (result.status === "success") {
        setSuccessMessage(result.message || "Utilisateur ajouté avec succès");
        setFormData({
          nom_complet: "",
          telephone: "",
          adresse: "",
          site_affecte_id: sites[0]?.id || 0,
        });
        setShowAddModal(false);
        loadUtilisateurs(); // Recharger la liste
      } else {
        setError(result.message || "Erreur lors de l'ajout de l'utilisateur");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur lors de l'ajout de l'utilisateur:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditUtilisateur = async () => {
    if (
      !selectedUtilisateur ||
      !formData.nom_complet ||
      !formData.telephone ||
      !formData.site_affecte_id ||
      formData.site_affecte_id === 0
    ) {
      setError("Le nom complet, le téléphone et le site sont obligatoires");
      return;
    }

    setProcessing(true);
    try {
      const result = await updateUtilisateur(selectedUtilisateur.id, formData);

      if (result.status === "success") {
        setSuccessMessage(result.message || "Utilisateur modifié avec succès");
        setShowEditModal(false);
        setSelectedUtilisateur(null);
        setFormData({
          nom_complet: "",
          telephone: "",
          adresse: "",
          site_affecte_id: sites[0]?.id || 0,
        });
        loadUtilisateurs(); // Recharger la liste
      } else {
        setError(
          result.message || "Erreur lors de la modification de l'utilisateur"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur lors de la modification de l'utilisateur:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUtilisateur = async () => {
    if (!selectedUtilisateur) return;

    setProcessing(true);
    try {
      const result = await deleteUtilisateur(selectedUtilisateur.id);

      if (result.status === "success") {
        setSuccessMessage(result.message || "Utilisateur supprimé avec succès");
        setShowDeleteModal(false);
        setSelectedUtilisateur(null);
        loadUtilisateurs(); // Recharger la liste
      } else {
        setError(
          result.message || "Erreur lors de la suppression de l'utilisateur"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUtilisateur) return;

    setProcessing(true);
    try {
      const result = await toggleUtilisateurStatus(
        selectedUtilisateur.id,
        !selectedUtilisateur.actif
      );

      if (result.status === "success") {
        setSuccessMessage(
          result.message || "Statut de l'utilisateur modifié avec succès"
        );
        setShowStatusModal(false);
        setSelectedUtilisateur(null);
        loadUtilisateurs(); // Recharger la liste
      } else {
        setError(
          result.message ||
            "Erreur lors du changement de statut de l'utilisateur"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error(
        "Erreur lors du changement de statut de l'utilisateur:",
        err
      );
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (utilisateur: UtilisateurType) => {
    setSelectedUtilisateur(utilisateur);
    setFormData({
      nom_complet: utilisateur.nom_complet,
      telephone: utilisateur.telephone,
      adresse: utilisateur.adresse,
      site_affecte_id: utilisateur.site_affecte_id,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (utilisateur: UtilisateurType) => {
    setSelectedUtilisateur(utilisateur);
    setShowDeleteModal(true);
  };

  const openStatusModal = (utilisateur: UtilisateurType) => {
    setSelectedUtilisateur(utilisateur);
    setShowStatusModal(true);
  };

  // Effacer les messages après un délai
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="h-full flex flex-col">
      {/* Messages d'alerte */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Users className="w-6 h-6 mr-2 text-[#153258]" />
          Liste des Utilisateurs
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent bg-gray-50 w-64"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom Complet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site Affecté
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Création
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredUtilisateurs.map((utilisateur) => (
                  <tr
                    key={utilisateur.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {utilisateur.nom_complet}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1 text-gray-500" />
                        {utilisateur.telephone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 max-w-xs truncate">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                        {utilisateur.adresse}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {utilisateur.site_nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          utilisateur.actif
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {utilisateur.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(utilisateur.date_creation).toLocaleDateString(
                        "fr-FR"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openStatusModal(utilisateur)}
                          className={`p-2 rounded-lg transition-colors ${
                            utilisateur.actif
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={utilisateur.actif ? "Désactiver" : "Activer"}
                        >
                          {utilisateur.actif ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(utilisateur)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(utilisateur)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUtilisateurs.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Ajouter Utilisateur */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-[#153258]" />
                  Ajouter un Utilisateur
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom Complet *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.nom_complet}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nom_complet: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.telephone}
                      onChange={(e) =>
                        setFormData({ ...formData, telephone: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                      placeholder="Ex: +243 81 234 5678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      value={formData.adresse}
                      onChange={(e) =>
                        setFormData({ ...formData, adresse: e.target.value })
                      }
                      rows={2}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent resize-none"
                      placeholder="Ex: 123 Avenue de la Paix, Kinshasa"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Affecté *
                  </label>
                  <select
                    value={formData.site_affecte_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        site_affecte_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                  >
                    <option value={0}>Sélectionner un site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddUtilisateur}
                    disabled={
                      !formData.nom_complet ||
                      !formData.telephone ||
                      !formData.site_affecte_id ||
                      formData.site_affecte_id === 0 ||
                      processing
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Modifier Utilisateur */}
      {showEditModal && selectedUtilisateur && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-[#153258]" />
                  Modifier l'Utilisateur
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUtilisateur(null);
                    setFormData({
                      nom_complet: "",
                      telephone: "",
                      adresse: "",
                      site_affecte_id: sites[0]?.id || 0,
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom Complet *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.nom_complet}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nom_complet: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.telephone}
                      onChange={(e) =>
                        setFormData({ ...formData, telephone: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      value={formData.adresse}
                      onChange={(e) =>
                        setFormData({ ...formData, adresse: e.target.value })
                      }
                      rows={2}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent resize-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Affecté *
                  </label>
                  <select
                    value={formData.site_affecte_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        site_affecte_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258] focus:border-transparent"
                  >
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUtilisateur(null);
                      setFormData({
                        nom_complet: "",
                        telephone: "",
                        adresse: "",
                        site_affecte_id: sites[0]?.id || 0,
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditUtilisateur}
                    disabled={
                      !formData.nom_complet ||
                      !formData.telephone ||
                      !formData.site_affecte_id ||
                      formData.site_affecte_id === 0 ||
                      processing
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Modifier</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Supprimer Utilisateur */}
      {showDeleteModal && selectedUtilisateur && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
                  <strong>{selectedUtilisateur.nom_complet}</strong> ? Cette
                  action est irréversible.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUtilisateur(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteUtilisateur}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Changer Statut Utilisateur */}
      {showStatusModal && selectedUtilisateur && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    selectedUtilisateur.actif ? "bg-red-100" : "bg-green-100"
                  }`}
                >
                  {selectedUtilisateur.actif ? (
                    <EyeOff className="w-8 h-8 text-red-600" />
                  ) : (
                    <Eye className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedUtilisateur.actif ? "Désactiver" : "Activer"}{" "}
                  l'utilisateur
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir{" "}
                  {selectedUtilisateur.actif ? "désactiver" : "activer"}{" "}
                  l'utilisateur{" "}
                  <strong>{selectedUtilisateur.nom_complet}</strong> ?
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedUtilisateur(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors ${
                      selectedUtilisateur.actif
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {selectedUtilisateur.actif ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Désactiver</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Activer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}