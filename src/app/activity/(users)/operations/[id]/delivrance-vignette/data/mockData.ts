import {
  Assujetti,
  Engin,
  Paiement,
  RecherchePaiementResponse,
} from "../components/types";

// Données mock pour les assujettis existants
export const mockAssujetti: Assujetti = {
  id: 462774,
  nom_complet: "OSONGA - ANDRE",
  telephone: "+243812345678",
  adresse: "A-038 AV. KILOSA Q. MOZINDO C. BARUMBU",
  nif: "A1234567X",
  email: "osonga.andre@email.com",
};

export const mockAssujetti2: Assujetti = {
  id: 462775,
  nom_complet: "MBUYI - JEAN",
  telephone: "+243823456789",
  adresse: "B-045 AV. LUMUMBA Q. KINTAMBO C. KALAMU",
  nif: "B7654321Y",
  email: "mbuyi.jean@email.com",
};

// Données mock pour les engins existants
export const mockEngin: Engin = {
  id: 191,
  numero_plaque: "SP222",
  marque: "TVS",
  modele: "HLX 125cc",
  couleur: "Noir",
  energie: "1",
  usage_engin: "1",
  puissance_fiscal: "2.5",
  annee_fabrication: "2024",
  annee_circulation: "2024",
  numero_chassis: "LHJTCJPLXR0997101",
  numero_moteur: "HL1E-123456",
  type_engin: "5",
};

export const mockEngin2: Engin = {
  id: 192,
  numero_plaque: "AB123",
  marque: "TOYOTA",
  modele: "Corolla",
  couleur: "Blanc",
  energie: "2",
  usage_engin: "1",
  puissance_fiscal: "7",
  annee_fabrication: "2023",
  annee_circulation: "2023",
  numero_chassis: "JH4KA7560LC005892",
  numero_moteur: "2C-123456",
  type_engin: "1",
};

// Données mock pour les paiements
export const mockPaiements: Paiement[] = [
  {
    id: 1001,
    montant: 20,
    montant_initial: 20,
    mode_paiement: "espece",
    operateur: "Bekeya",
    numero_transaction: "VIGN-1709123456789-123",
    date_paiement: "2024-02-28 14:30:25",
    statut: "completed",
  },
  {
    id: 1002,
    montant: 20,
    montant_initial: 20,
    mode_paiement: "espece",
    operateur: "Bekeya",
    numero_transaction: "VIGN-1709234567890-456",
    date_paiement: "2024-02-28 15:45:10",
    statut: "completed",
  },
  {
    id: 1003,
    montant: 20,
    montant_initial: 20,
    mode_paiement: "mobile_money",
    operateur: "Airtel",
    numero_transaction: "MOB-240228-789012",
    date_paiement: "2024-02-29 09:12:33",
    statut: "completed",
  },
  {
    id: 1004,
    montant: 20,
    montant_initial: 20,
    mode_paiement: "mobile_money",
    operateur: "Orange",
    numero_transaction: "SSD-240229-345678",
    date_paiement: "2024-02-29 10:05:47",
    statut: "completed",
  },
];

// Association paiements - plaques
export const paiementsExistants = [
  {
    reference: "VIGN-1709123456789-123",
    plaque: "SP222",
    assujettiId: 462774,
    enginId: 191,
    paiementId: 1001,
  },
  {
    reference: "VIGN-1709234567890-456",
    plaque: "AB123",
    assujettiId: 462775,
    enginId: 192,
    paiementId: 1002,
  },
  {
    reference: "MOB-240228-789012",
    plaque: "CD456",
    assujettiId: null,
    enginId: null,
    paiementId: 1003,
  },
  {
    reference: "SSD-240229-345678",
    plaque: "EF789",
    assujettiId: null,
    enginId: null,
    paiementId: 1004,
  },
];

// Fonction de recherche
export function rechercherPaiement(
  reference: string,
  plaque: string,
): RecherchePaiementResponse {
  const referenceUpper = reference.toUpperCase().trim();
  const plaqueUpper = plaque.toUpperCase();

  // Chercher si la référence existe
  const paiementExistant = paiementsExistants.find(
    (p) => p.reference === referenceUpper,
  );

  if (!paiementExistant) {
    return {
      exists: false,
      message: "Aucun paiement trouvé avec cette référence",
    };
  }

  // Récupérer les infos du paiement
  const paiementInfo = mockPaiements.find(
    (p) => p.id === paiementExistant.paiementId,
  );

  // Si la référence existe mais pas de plaque associée ou plaque différente
  if (
    !paiementExistant.assujettiId ||
    paiementExistant.plaque !== plaqueUpper
  ) {
    return {
      exists: true,
      paiement: paiementInfo,
      message: "Paiement trouvé mais véhicule non enregistré",
    };
  }

  // Si tout existe
  const assujetti =
    paiementExistant.assujettiId === 462774 ? mockAssujetti : mockAssujetti2;
  const engin = paiementExistant.enginId === 191 ? mockEngin : mockEngin2;

  return {
    exists: true,
    assujetti,
    engin,
    paiement: paiementInfo,
  };
}
