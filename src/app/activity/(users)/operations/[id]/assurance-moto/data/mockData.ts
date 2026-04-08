// data/mockData.ts
import { Assujetti, Engin, RechercheResponse } from '../components/types';

export const mockAssujetti: Assujetti = {
  id: 462774,
  nom_complet: "OSONGA - ANDRE",
  telephone: "+243812345678",
  adresse: "A-038 AV. KILOSA Q. MOZINDO C. BARUMBU",
  nif: "A1234567X",
  email: "osonga.andre@email.com"
};

export const mockEngin: Engin = {
  id: 191,
  numero_plaque: "SP222",
  marque: "TVS HLX125",
  modele: "HLX 125cc",
  couleur: "Noir",
  energie: "Essence",
  usage_engin: "Particulier",
  puissance_fiscal: "2.5",
  annee_fabrication: "2024",
  annee_circulation: "2024",
  numero_chassis: "LHJTCJPLXR0997101",
  numero_moteur: "HL1E-123456",
  type_engin: "Moto"
};

// Données pour la recherche mock
export const plaquesExistantes = ["SP222", "AA256", "AR784", "EC012", "AB123", "CD456"];

export function rechercherPlaque(plaque: string): RechercheResponse {
  const plaqueUpper = plaque.toUpperCase();
  
  if (plaquesExistantes.includes(plaqueUpper)) {
    return {
      existe: true,
      assujetti: { 
        ...mockAssujetti, 
        id: mockAssujetti.id + Math.floor(Math.random() * 100),
        nom_complet: `CLIENT - ${plaqueUpper}` 
      },
      engin: { 
        ...mockEngin, 
        numero_plaque: plaqueUpper,
        marque: plaqueUpper === "SP222" ? "TVS HLX125" : "TOYOTA",
        modele: plaqueUpper === "SP222" ? "HLX 125cc" : "Corolla"
      }
    };
  }
  
  return {
    existe: false,
    message: "Aucun véhicule trouvé avec cette plaque"
  };
}
