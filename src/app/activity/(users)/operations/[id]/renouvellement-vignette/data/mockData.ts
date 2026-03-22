import { Vignette, Assujetti, Engin, Paiement } from "../components/types";

// Assujettis mock
export const assujettis: Assujetti[] = [
  {
    id: 462774,
    nom_complet: "OSONGA - ANDRE",
    telephone: "+243812345678",
    adresse: "A-038 AV. KILOSA Q. MOZINDO C. BARUMBU",
    nif: "A1234567X",
    email: "osonga.andre@email.com",
  },
  {
    id: 462775,
    nom_complet: "MBUYI - JEAN",
    telephone: "+243823456789",
    adresse: "B-045 AV. LUMUMBA Q. KINTAMBO C. KALAMU",
    nif: "B7654321Y",
    email: "mbuyi.jean@email.com",
  },
  {
    id: 462776,
    nom_complet: "KABEYA - MARIE",
    telephone: "+243832345678",
    adresse: "C-012 AV. DE LA LIBERTE Q. GOMBE C. KINSHASA",
    nif: "C9876543Z",
    email: "kabeya.marie@email.com",
  },
  {
    id: 462777,
    nom_complet: "ILUNGA - PIERRE",
    telephone: "+243842345678",
    adresse: "D-078 AV. DES NATIONS Q. LINGWALA C. KINSHASA",
    nif: "D2468135A",
    email: "ilunga.pierre@email.com",
  },
  {
    id: 462778,
    nom_complet: "TSHIBUYI - PAUL",
    telephone: "+243852345678",
    adresse: "E-156 AV. DE L'UNIVERSITE Q. LEMBA C. LEMBA",
    nif: "E1357924B",
    email: "tshibuyi.paul@email.com",
  },
  {
    id: 462779,
    nom_complet: "KALENGA - JOSEPH",
    telephone: "+243862345678",
    adresse: "F-234 AV. DU MARCHE Q. MATETE C. MATETE",
    nif: "F8642093C",
    email: "kalenga.joseph@email.com",
  },
  {
    id: 462780,
    nom_complet: "MUKENDI - ALBERT",
    telephone: "+243872345678",
    adresse: "G-312 AV. DE LA PAIX Q. NGALIEMA C. NGALIEMA",
    nif: "G5719368D",
    email: "mukendi.albert@email.com",
  },
];

// Engins mock
export const engins: Engin[] = [
  {
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
  },
  {
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
  },
  {
    id: 193,
    numero_plaque: "CD456",
    marque: "HONDA",
    modele: "Civic",
    couleur: "Rouge",
    energie: "1",
    usage_engin: "1",
    puissance_fiscal: "6",
    annee_fabrication: "2023",
    annee_circulation: "2023",
    numero_chassis: "2HGFG12669H123456",
    numero_moteur: "D17A-123456",
    type_engin: "1",
  },
  {
    id: 194,
    numero_plaque: "EF789",
    marque: "YAMAHA",
    modele: "MT-07",
    couleur: "Bleu",
    energie: "1",
    usage_engin: "1",
    puissance_fiscal: "4.5",
    annee_fabrication: "2023",
    annee_circulation: "2023",
    numero_chassis: "JYARN37E0FA012345",
    numero_moteur: "CP2-123456",
    type_engin: "5",
  },
  {
    id: 195,
    numero_plaque: "GH012",
    marque: "ISUZU",
    modele: "D-MAX",
    couleur: "Gris",
    energie: "2",
    usage_engin: "2",
    puissance_fiscal: "10",
    annee_fabrication: "2022",
    annee_circulation: "2022",
    numero_chassis: "MPATFR85JGH012345",
    numero_moteur: "4JJ1-123456",
    type_engin: "4",
  },
  {
    id: 196,
    numero_plaque: "IJ345",
    marque: "RENAULT",
    modele: "Clio",
    couleur: "Argent",
    energie: "1",
    usage_engin: "1",
    puissance_fiscal: "5",
    annee_fabrication: "2023",
    annee_circulation: "2023",
    numero_chassis: "VF1BR0B0H12345678",
    numero_moteur: "H4M-123456",
    type_engin: "1",
  },
  {
    id: 197,
    numero_plaque: "KL678",
    marque: "BAJAJ",
    modele: "Pulsar 150",
    couleur: "Noir",
    energie: "1",
    usage_engin: "1",
    puissance_fiscal: "2",
    annee_fabrication: "2024",
    annee_circulation: "2024",
    numero_chassis: "MD2A28BZ1JZ123456",
    numero_moteur: "DTSi-123456",
    type_engin: "5",
  },
];

// Paiements mock
export const paiements: Paiement[] = [
  {
    id: 1001,
    montant: 20,
    mode_paiement: "espece",
    operateur: null,
    numero_transaction: "VIGN-1709123456789-123",
    date_paiement: "2024-01-15 10:30:25",
  },
  {
    id: 1002,
    montant: 20,
    mode_paiement: "espece",
    operateur: null,
    numero_transaction: "VIGN-1709234567890-456",
    date_paiement: "2024-01-20 14:45:10",
  },
  {
    id: 1003,
    montant: 20,
    mode_paiement: "mobile_money",
    operateur: "Airtel",
    numero_transaction: "MOB-240115-789012",
    date_paiement: "2024-02-05 09:12:33",
  },
  {
    id: 1004,
    montant: 20,
    mode_paiement: "mobile_money",
    operateur: "Orange",
    numero_transaction: "SSD-240210-345678",
    date_paiement: "2024-02-10 11:05:47",
  },
  {
    id: 1005,
    montant: 20,
    mode_paiement: "espece",
    operateur: null,
    numero_transaction: "VIGN-1710123456789-789",
    date_paiement: "2024-03-01 16:20:15",
  },
  {
    id: 1006,
    montant: 20,
    mode_paiement: "mobile_money",
    operateur: "Vodacom",
    numero_transaction: "MNO-240315-123456",
    date_paiement: "2024-03-15 13:45:22",
  },
  {
    id: 1007,
    montant: 20,
    mode_paiement: "espece",
    operateur: null,
    numero_transaction: "VIGN-1711234567890-012",
    date_paiement: "2024-04-01 10:10:10",
  },
];

// Fonction pour générer des dates d'expiration (6 mois après achat)
const getDateExpiration = (dateAchat: string): string => {
  const date = new Date(dateAchat);
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().replace("T", " ").substring(0, 19);
};

// Vignettes avec différents statuts
export const vignettes: Vignette[] = [
  // Expirée (il y a 2 mois)
  {
    id: 1,
    assujetti: assujettis[0],
    engin: engins[0],
    paiement: paiements[0],
    site_achat: "LIMETE",
    date_achat: "2023-12-15 10:30:25",
    date_expiration: getDateExpiration("2023-12-15 10:30:25"),
    montant_paye: 20,
    mode_paiement: "espece",
    reference_paiement: paiements[0].numero_transaction,
  },

  // Expirée (il y a 1 mois)
  {
    id: 2,
    assujetti: assujettis[1],
    engin: engins[1],
    paiement: paiements[1],
    site_achat: "NGIRI-NGIRI",
    date_achat: "2024-01-20 14:45:10",
    date_expiration: getDateExpiration("2024-01-20 14:45:10"),
    montant_paye: 20,
    mode_paiement: "espece",
    reference_paiement: paiements[1].numero_transaction,
  },

  // Proche expiration (15 jours)
  {
    id: 3,
    assujetti: assujettis[2],
    engin: engins[2],
    paiement: paiements[2],
    site_achat: "MATADI",
    date_achat: "2024-02-05 09:12:33",
    date_expiration: getDateExpiration("2024-02-05 09:12:33"),
    montant_paye: 20,
    mode_paiement: "mobile_money",
    reference_paiement: paiements[2].numero_transaction,
  },

  // Proche expiration (20 jours)
  {
    id: 4,
    assujetti: assujettis[3],
    engin: engins[3],
    paiement: paiements[3],
    site_achat: "KINKOLE",
    date_achat: "2024-02-10 11:05:47",
    date_expiration: getDateExpiration("2024-02-10 11:05:47"),
    montant_paye: 20,
    mode_paiement: "mobile_money",
    reference_paiement: paiements[3].numero_transaction,
  },

  // Proche expiration (28 jours)
  {
    id: 5,
    assujetti: assujettis[4],
    engin: engins[4],
    paiement: paiements[4],
    site_achat: "KIMBANSEKE",
    date_achat: "2024-03-01 16:20:15",
    date_expiration: getDateExpiration("2024-03-01 16:20:15"),
    montant_paye: 20,
    mode_paiement: "espece",
    reference_paiement: paiements[4].numero_transaction,
  },

  // Valide (2 mois restants)
  {
    id: 6,
    assujetti: assujettis[5],
    engin: engins[5],
    paiement: paiements[5],
    site_achat: "LIMETE",
    date_achat: "2024-03-15 13:45:22",
    date_expiration: getDateExpiration("2024-03-15 13:45:22"),
    montant_paye: 20,
    mode_paiement: "mobile_money",
    reference_paiement: paiements[5].numero_transaction,
  },

  // Valide (4 mois restants)
  {
    id: 7,
    assujetti: assujettis[6],
    engin: engins[6],
    paiement: paiements[6],
    site_achat: "MATETE",
    date_achat: "2024-04-01 10:10:10",
    date_expiration: getDateExpiration("2024-04-01 10:10:10"),
    montant_paye: 20,
    mode_paiement: "espece",
    reference_paiement: paiements[6].numero_transaction,
  },
];

// Fonction pour récupérer toutes les vignettes
export function getVignettes(): Vignette[] {
  return vignettes;
}

// Fonction de recherche par plaque ou téléphone
export function rechercherVignettes(term: string): Vignette[] {
  if (!term.trim()) {
    return vignettes;
  }

  const searchTerm = term.toLowerCase().trim();

  return vignettes.filter(
    (v) =>
      v.engin.numero_plaque.toLowerCase().includes(searchTerm) ||
      v.assujetti.telephone.toLowerCase().includes(searchTerm) ||
      v.assujetti.nom_complet.toLowerCase().includes(searchTerm),
  );
}
