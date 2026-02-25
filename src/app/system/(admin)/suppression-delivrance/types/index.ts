export interface FilterState {
  date_debut: string;
  date_fin: string;
  site_id: number;
  type_engin: string;
  order_by: string;
  order_dir: "ASC" | "DESC";
}

export interface Site {
  id: number;
  nom: string;
  code: string;
}

export interface TypeVehicule {
  type: string;
  count: number;
}

export interface StatsCartesRoses {
  total: number;
  clientsUniques: number;
  datePremiere: string;
  dateDerniere: string;
  typesVehicules?: Record<string, number>;
}

// Fonction utilitaire pour formater la date
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
};
