export type Etape = "verification" | "confirmation" | "recapitulatif";

export interface RefactorFormData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nif: string;
  typeEngin: string;
  anneeFabrication: string;
  anneeCirculation: string;
  couleur: string;
  puissanceFiscal: string;
  usage: string;
  marque: string;
  energie: string;
  numeroPlaque: string;
  numeroChassis: string;
  numeroMoteur: string;
}
