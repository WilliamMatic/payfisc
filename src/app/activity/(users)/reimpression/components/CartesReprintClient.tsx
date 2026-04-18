// src/app/activity/(users)/reimpression/components/CartesReprintClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Filter, Search, Printer, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCartesReprint,
  CarteReprintData,
} from "@/services/cartes-reprint/cartesReprintService";
import StatsCards from "./StatsCards";
import CartesTable from "./CartesTable";
import ErrorModal from "./ErrorModal";
import MultiPrintModal from "./MultiPrintModal";
import { CarteReprint } from "../types"; // À créer

export default function CartesReprintClient() {
  const { utilisateur } = useAuth();

  const [cartes, setCartes] = useState<CarteReprint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    aImprimer: 0,
    dejaImprime: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [selectedCartes, setSelectedCartes] = useState<Set<number>>(new Set());
  const [showMultiPrintModal, setShowMultiPrintModal] = useState(false);

  // Gestionnaire d'erreurs
  const handleError = useCallback((title: string, message: string) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
    });
  }, []);

  // Chargement des données
  const loadCartes = useCallback(async () => {
    if (!utilisateur) {
      handleError("Erreur d'authentification", "Utilisateur non connecté");
      return;
    }

    setIsLoading(true);

    try {
      const response = await getCartesReprint(
        utilisateur,
        pagination.page,
        pagination.limit,
        searchTerm,
        statusFilter,
      );

      if (response.status === "success") {
        setCartes(response.data || []);
        setStats(response.stats || stats);
        setPagination(response.pagination || pagination);
      } else {
        handleError(
          "Erreur de chargement",
          response.message || "Échec de la récupération des données",
        );
        setCartes([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      handleError(
        "Erreur système",
        err instanceof Error ? err.message : "Erreur de connexion au serveur",
      );
      setCartes([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    utilisateur,
    pagination.page,
    pagination.limit,
    searchTerm,
    statusFilter,
    handleError,
  ]);

  // Chargement initial
  useEffect(() => {
    loadCartes();
  }, [loadCartes]);

  // Mise à jour après impression
  const handlePrintSuccess = useCallback((carteId: number) => {
    setCartes((prev) =>
      prev.map((carte) =>
        carte.id === carteId ? { ...carte, status: 1 } : carte,
      ),
    );

    setStats((prev) => ({
      ...prev,
      aImprimer: Math.max(0, prev.aImprimer - 1),
      dejaImprime: prev.dejaImprime + 1,
    }));
  }, []);

  // Changement de page
  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    setSelectedCartes(new Set());
  }, []);

  // Rafraîchissement
  const handleRefresh = useCallback(() => {
    loadCartes();
  }, [loadCartes]);

  // Application des filtres
  const handleApplyFilters = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedCartes(new Set());
    loadCartes();
  }, [loadCartes]);

  // Gestion de la sélection multiple
  const handleSelectionChange = useCallback((selected: Set<number>) => {
    setSelectedCartes(selected);
  }, []);

  // Impression multiple réussie
  const handleMultiPrintSuccess = useCallback((carteIds: number[]) => {
    setCartes((prev) =>
      prev.map((carte) =>
        carteIds.includes(carte.id) ? { ...carte, status: 1 } : carte,
      ),
    );
    setStats((prev) => ({
      ...prev,
      aImprimer: Math.max(0, prev.aImprimer - carteIds.length),
      dejaImprime: prev.dejaImprime + carteIds.length,
    }));
  }, []);

  const handleMultiPrintClose = useCallback(() => {
    setShowMultiPrintModal(false);
    setSelectedCartes(new Set());
    loadCartes();
  }, [loadCartes]);

  return (
    <>
      {/* En-tête avec infos utilisateur */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Site:{" "}
            <span className="font-semibold">
              {utilisateur?.site_nom || "Non spécifié"}
            </span>
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-[#2D5B7A]/10 text-[#2D5B7A] rounded-xl hover:bg-[#2D5B7A]/20 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>{isLoading ? "Chargement..." : "Actualiser"}</span>
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <StatsCards stats={stats} />

        {/* Barre de recherche et filtres */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              placeholder="Rechercher par nom, plaque, NIF..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/40 focus:border-[#2D5B7A] transition-all"
            />
          </div>

          <div className="flex space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/40 focus:border-[#2D5B7A] transition-all"
            >
              <option value="all">Tous les status</option>
              <option value="0">À imprimer</option>
              <option value="1">Déjà imprimé</option>
            </select>
            <button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des cartes */}
      <CartesTable
        cartes={cartes}
        isLoading={isLoading}
        pagination={pagination}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onPageChange={handlePageChange}
        onPrintSuccess={handlePrintSuccess}
        utilisateur={utilisateur}
        onRefresh={handleRefresh}
        selectedCartes={selectedCartes}
        onSelectionChange={handleSelectionChange}
      />

      {/* Barre d'action flottante */}
      {selectedCartes.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-[#2D5B7A] text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center space-x-4">
            <span className="font-medium text-sm">
              {selectedCartes.size} carte{selectedCartes.size > 1 ? "s" : ""} sélectionnée{selectedCartes.size > 1 ? "s" : ""}
            </span>
            <div className="w-px h-8 bg-white/30" />
            <button
              onClick={() => setShowMultiPrintModal(true)}
              className="px-4 py-2 bg-white text-[#2D5B7A] rounded-xl hover:bg-gray-100 transition-colors font-medium flex items-center space-x-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la sélection</span>
            </button>
            <button
              onClick={() => setSelectedCartes(new Set())}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal d'impression multiple */}
      <MultiPrintModal
        isOpen={showMultiPrintModal}
        onClose={handleMultiPrintClose}
        cartes={cartes.filter(c => selectedCartes.has(c.id_primaire))}
        utilisateur={utilisateur}
        onPrintSuccess={handleMultiPrintSuccess}
      />

      {/* Modal d'erreur */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
