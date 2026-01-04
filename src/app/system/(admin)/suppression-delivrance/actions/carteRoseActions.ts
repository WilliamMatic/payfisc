"use server";

import {
  getCartesRoses,
  getStatsCartesRoses,
  annulerCarteRose,
  getSitesDisponibles,
  exporterCartesRosesExcel,
  getTypesVehicules,
} from "@/services/carteRose/carteRoseService";
import type {
  CarteRose,
  StatsCartesRoses,
  RechercheParamsCartesRoses,
  Site,
  TypeVehicule,
  FilterState,
} from "../types/carteRoseTypes";

export async function fetchCartesRoses(
  params: RechercheParamsCartesRoses
): Promise<{
  cartesRoses: CarteRose[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const result = await getCartesRoses(params);

  if (result.status === "success" && result.data) {
    const cartesRosesArray = Array.isArray(result.data.cartesRoses)
      ? result.data.cartesRoses
      : [];
    
    const paginationData = result.data.pagination || {
      total: cartesRosesArray.length,
      page: params.page || 1,
      limit: params.limit || 20,
      totalPages: Math.max(1, Math.ceil(cartesRosesArray.length / (params.limit || 20))),
    };

    return {
      cartesRoses: cartesRosesArray,
      pagination: paginationData,
    };
  }

  throw new Error(result.message || "Erreur lors du chargement des cartes roses");
}

export async function fetchStats(
  params: Omit<RechercheParamsCartesRoses, "page" | "limit" | "order_by" | "order_dir">
): Promise<StatsCartesRoses | null> {
  const result = await getStatsCartesRoses(params);
  
  if (result.status === "success" && result.data) {
    return result.data;
  }
  
  return null;
}

export async function fetchSites(): Promise<Site[]> {
  const result = await getSitesDisponibles();
  
  if (result.status === "success" && result.data) {
    return result.data;
  }
  
  return [];
}

export async function fetchTypesVehicules(): Promise<TypeVehicule[]> {
  const result = await getTypesVehicules();
  
  if (result.status === "success" && result.data) {
    return result.data;
  }
  
  return [];
}

export async function handleAnnulerCarteRose(
  paiementId: number,
  userId: number,
  motif: string
): Promise<{ success: boolean; message: string }> {
  const result = await annulerCarteRose(paiementId, userId, motif);
  
  if (result.status === "success") {
    return { success: true, message: result.message || "Carte rose annulée avec succès" };
  }
  
  return { success: false, message: result.message || "Erreur lors de l'annulation" };
}