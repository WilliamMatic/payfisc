export const formatMontant = (n: number, devise = "USD") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise, minimumFractionDigits: 0 }).format(n || 0);

export const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
};

export const formatDateTime = (d?: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("fr-FR"); } catch { return d; }
};

export const STATUT_BIEN_COLORS: Record<string, string> = {
  en_attente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  valide: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  rejete: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export const STATUT_FACTURE_COLORS: Record<string, string> = {
  impayee: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  payee: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  annulee: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  en_retard: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};
