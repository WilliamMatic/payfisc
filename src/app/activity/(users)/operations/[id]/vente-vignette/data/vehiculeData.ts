// data/vehiculeData.ts

export interface Marque {
  id: number;
  nom: string;
  type_engin: number; // 1: Voiture, 2: Camion, 3: Bus, 4: Utilitaire, 5: Moto
}

export interface Modele {
  id: number;
  nom: string;
  marque_id: number;
  type_engin: number;
}

export const marquesData: Marque[] = [
  // Moto (type_engin: 5)
  { id: 1, nom: "TVS", type_engin: 5 },
  { id: 2, nom: "HONDA", type_engin: 5 },
  { id: 3, nom: "YAMAHA", type_engin: 5 },
  { id: 4, nom: "SUZUKI", type_engin: 5 },
  { id: 5, nom: "KAWASAKI", type_engin: 5 },
  { id: 6, nom: "BAJAJ", type_engin: 5 },
  { id: 7, nom: "SYM", type_engin: 5 },
  { id: 8, nom: "PIAGGIO", type_engin: 5 },
  { id: 9, nom: "KTM", type_engin: 5 },
  { id: 10, nom: "APRILIA", type_engin: 5 },
  { id: 11, nom: "BENELLI", type_engin: 5 },
  { id: 12, nom: "ROYAL ENFIELD", type_engin: 5 },
  
  // Voitures (type_engin: 1)
  { id: 13, nom: "TOYOTA", type_engin: 1 },
  { id: 14, nom: "HONDA", type_engin: 1 },
  { id: 15, nom: "NISSAN", type_engin: 1 },
  { id: 16, nom: "MAZDA", type_engin: 1 },
  { id: 17, nom: "MITSUBISHI", type_engin: 1 },
  { id: 18, nom: "SUZUKI", type_engin: 1 },
  { id: 19, nom: "HYUNDAI", type_engin: 1 },
  { id: 20, nom: "KIA", type_engin: 1 },
  { id: 21, nom: "RENAULT", type_engin: 1 },
  { id: 22, nom: "PEUGEOT", type_engin: 1 },
  { id: 23, nom: "CITROEN", type_engin: 1 },
  { id: 24, nom: "VOLKSWAGEN", type_engin: 1 },
  { id: 25, nom: "BMW", type_engin: 1 },
  { id: 26, nom: "MERCEDES", type_engin: 1 },
  { id: 27, nom: "AUDI", type_engin: 1 },
  { id: 28, nom: "FORD", type_engin: 1 },
  { id: 29, nom: "CHEVROLET", type_engin: 1 },
  { id: 30, nom: "ISUZU", type_engin: 1 },
  
  // Camions (type_engin: 2)
  { id: 31, nom: "ISUZU", type_engin: 2 },
  { id: 32, nom: "HINO", type_engin: 2 },
  { id: 33, nom: "MERCEDES", type_engin: 2 },
  { id: 34, nom: "MAN", type_engin: 2 },
  { id: 35, nom: "SCANIA", type_engin: 2 },
  { id: 36, nom: "VOLVO", type_engin: 2 },
  { id: 37, nom: "DAF", type_engin: 2 },
  { id: 38, nom: "RENAULT", type_engin: 2 },
  { id: 39, nom: "IVECO", type_engin: 2 },
  
  // Bus (type_engin: 3)
  { id: 40, nom: "MERCEDES", type_engin: 3 },
  { id: 41, nom: "SCANIA", type_engin: 3 },
  { id: 42, nom: "VOLVO", type_engin: 3 },
  { id: 43, nom: "MAN", type_engin: 3 },
  { id: 44, nom: "ISUZU", type_engin: 3 },
  { id: 45, nom: "TOYOTA", type_engin: 3 },
  { id: 46, nom: "HYUNDAI", type_engin: 3 },
  
  // Utilitaires (type_engin: 4)
  { id: 47, nom: "TOYOTA", type_engin: 4 },
  { id: 48, nom: "NISSAN", type_engin: 4 },
  { id: 49, nom: "MITSUBISHI", type_engin: 4 },
  { id: 50, nom: "ISUZU", type_engin: 4 },
  { id: 51, nom: "FORD", type_engin: 4 },
  { id: 52, nom: "RENAULT", type_engin: 4 },
  { id: 53, nom: "PEUGEOT", type_engin: 4 },
  { id: 54, nom: "MERCEDES", type_engin: 4 },
];

export const modelesData: Modele[] = [
  // TVS (id: 1) - Moto
  { id: 1, nom: "HLX 125", marque_id: 1, type_engin: 5 },
  { id: 2, nom: "HLX 150", marque_id: 1, type_engin: 5 },
  { id: 3, nom: "APACHE RTR 160", marque_id: 1, type_engin: 5 },
  { id: 4, nom: "APACHE RTR 180", marque_id: 1, type_engin: 5 },
  { id: 5, nom: "APACHE RR 310", marque_id: 1, type_engin: 5 },
  { id: 6, nom: "JUPITER", marque_id: 1, type_engin: 5 },
  { id: 7, nom: "NTORQ", marque_id: 1, type_engin: 5 },
  { id: 8, nom: "SCOOTY", marque_id: 1, type_engin: 5 },
  { id: 9, nom: "WEGO", marque_id: 1, type_engin: 5 },
  { id: 10, nom: "STARCITY", marque_id: 1, type_engin: 5 },
  { id: 11, nom: "SPORT", marque_id: 1, type_engin: 5 },
  { id: 12, nom: "XL 100", marque_id: 1, type_engin: 5 },
  
  // HONDA (id: 2) - Moto
  { id: 13, nom: "CBR 150R", marque_id: 2, type_engin: 5 },
  { id: 14, nom: "CBR 250R", marque_id: 2, type_engin: 5 },
  { id: 15, nom: "CB 125F", marque_id: 2, type_engin: 5 },
  { id: 16, nom: "CB 150F", marque_id: 2, type_engin: 5 },
  { id: 17, nom: "CB 200X", marque_id: 2, type_engin: 5 },
  { id: 18, nom: "CB 300R", marque_id: 2, type_engin: 5 },
  { id: 19, nom: "XRE 300", marque_id: 2, type_engin: 5 },
  { id: 20, nom: "XR 150", marque_id: 2, type_engin: 5 },
  { id: 21, nom: "XR 190L", marque_id: 2, type_engin: 5 },
  { id: 22, nom: "PCX 150", marque_id: 2, type_engin: 5 },
  { id: 23, nom: "ADV 150", marque_id: 2, type_engin: 5 },
  { id: 24, nom: "VISION", marque_id: 2, type_engin: 5 },
  { id: 25, nom: "WAVE", marque_id: 2, type_engin: 5 },
  { id: 26, nom: "SUPRA GTR", marque_id: 2, type_engin: 5 },
  { id: 27, nom: "SONIC", marque_id: 2, type_engin: 5 },
  
  // YAMAHA (id: 3) - Moto
  { id: 28, nom: "YZF R15", marque_id: 3, type_engin: 5 },
  { id: 29, nom: "YZF R3", marque_id: 3, type_engin: 5 },
  { id: 30, nom: "MT-15", marque_id: 3, type_engin: 5 },
  { id: 31, nom: "MT-25", marque_id: 3, type_engin: 5 },
  { id: 32, nom: "FZ-S", marque_id: 3, type_engin: 5 },
  { id: 33, nom: "FZ-X", marque_id: 3, type_engin: 5 },
  { id: 34, nom: "NMAX", marque_id: 3, type_engin: 5 },
  { id: 35, nom: "AEROX", marque_id: 3, type_engin: 5 },
  { id: 36, nom: "GRANDE", marque_id: 3, type_engin: 5 },
  { id: 37, nom: "LEXI", marque_id: 3, type_engin: 5 },
  { id: 38, nom: "XMAX", marque_id: 3, type_engin: 5 },
  { id: 39, nom: "TRICITY", marque_id: 3, type_engin: 5 },
  
  // SUZUKI (id: 4) - Moto
  { id: 40, nom: "GSX R150", marque_id: 4, type_engin: 5 },
  { id: 41, nom: "GSX 250R", marque_id: 4, type_engin: 5 },
  { id: 42, nom: "GIXXER 150", marque_id: 4, type_engin: 5 },
  { id: 43, nom: "GIXXER SF 250", marque_id: 4, type_engin: 5 },
  { id: 44, nom: "V-STROM 250", marque_id: 4, type_engin: 5 },
  { id: 45, nom: "BURGMAN", marque_id: 4, type_engin: 5 },
  { id: 46, nom: "ADDRESS", marque_id: 4, type_engin: 5 },
  { id: 47, nom: "AVENIS", marque_id: 4, type_engin: 5 },
  
  // BAJAJ (id: 6) - Moto
  { id: 48, nom: "PULSAR 125", marque_id: 6, type_engin: 5 },
  { id: 49, nom: "PULSAR 150", marque_id: 6, type_engin: 5 },
  { id: 50, nom: "PULSAR 180", marque_id: 6, type_engin: 5 },
  { id: 51, nom: "PULSAR 200NS", marque_id: 6, type_engin: 5 },
  { id: 52, nom: "PULSAR 220F", marque_id: 6, type_engin: 5 },
  { id: 53, nom: "PULSAR RS200", marque_id: 6, type_engin: 5 },
  { id: 54, nom: "PULSAR N160", marque_id: 6, type_engin: 5 },
  { id: 55, nom: "PULSAR N250", marque_id: 6, type_engin: 5 },
  { id: 56, nom: "DOMINAR 400", marque_id: 6, type_engin: 5 },
  { id: 57, nom: "AVENGER", marque_id: 6, type_engin: 5 },
  { id: 58, nom: "CT 100", marque_id: 6, type_engin: 5 },
  { id: 59, nom: "PLATINA", marque_id: 6, type_engin: 5 },
  { id: 60, nom: "BOXER", marque_id: 6, type_engin: 5 },
  
  // TOYOTA (id: 13) - Voiture
  { id: 61, nom: "COROLLA", marque_id: 13, type_engin: 1 },
  { id: 62, nom: "CAMRY", marque_id: 13, type_engin: 1 },
  { id: 63, nom: "YARIS", marque_id: 13, type_engin: 1 },
  { id: 64, nom: "RAV4", marque_id: 13, type_engin: 1 },
  { id: 65, nom: "HILUX", marque_id: 13, type_engin: 1 },
  { id: 66, nom: "FORTUNER", marque_id: 13, type_engin: 1 },
  { id: 67, nom: "PRADO", marque_id: 13, type_engin: 1 },
  { id: 68, nom: "LAND CRUISER", marque_id: 13, type_engin: 1 },
  { id: 69, nom: "AVENSIS", marque_id: 13, type_engin: 1 },
  { id: 70, nom: "AURIS", marque_id: 13, type_engin: 1 },
  { id: 71, nom: "CELICA", marque_id: 13, type_engin: 1 },
  { id: 72, nom: "PASEO", marque_id: 13, type_engin: 1 },
  
  // RENAULT (id: 21) - Voiture
  { id: 73, nom: "CLIO", marque_id: 21, type_engin: 1 },
  { id: 74, nom: "MEGANE", marque_id: 21, type_engin: 1 },
  { id: 75, nom: "SCENIC", marque_id: 21, type_engin: 1 },
  { id: 76, nom: "KADJAR", marque_id: 21, type_engin: 1 },
  { id: 77, nom: "CAPTUR", marque_id: 21, type_engin: 1 },
  { id: 78, nom: "KOLEOS", marque_id: 21, type_engin: 1 },
  { id: 79, nom: "LAGUNA", marque_id: 21, type_engin: 1 },
  { id: 80, nom: "TWINGO", marque_id: 21, type_engin: 1 },
  { id: 81, nom: "ZOÉ", marque_id: 21, type_engin: 1 },
  { id: 82, nom: "SANDERO", marque_id: 21, type_engin: 1 },
  { id: 83, nom: "LOGAN", marque_id: 21, type_engin: 1 },
  { id: 84, nom: "DUSTER", marque_id: 21, type_engin: 1 },
  { id: 85, nom: "LODGY", marque_id: 21, type_engin: 1 },
  { id: 86, nom: "DOKKER", marque_id: 21, type_engin: 1 },
  
  // PEUGEOT (id: 22) - Voiture
  { id: 87, nom: "206", marque_id: 22, type_engin: 1 },
  { id: 88, nom: "207", marque_id: 22, type_engin: 1 },
  { id: 89, nom: "208", marque_id: 22, type_engin: 1 },
  { id: 90, nom: "306", marque_id: 22, type_engin: 1 },
  { id: 91, nom: "307", marque_id: 22, type_engin: 1 },
  { id: 92, nom: "308", marque_id: 22, type_engin: 1 },
  { id: 93, nom: "406", marque_id: 22, type_engin: 1 },
  { id: 94, nom: "407", marque_id: 22, type_engin: 1 },
  { id: 95, nom: "508", marque_id: 22, type_engin: 1 },
  { id: 96, nom: "3008", marque_id: 22, type_engin: 1 },
  { id: 97, nom: "5008", marque_id: 22, type_engin: 1 },
  { id: 98, nom: "PARTNER", marque_id: 22, type_engin: 1 },
  { id: 99, nom: "EXPERT", marque_id: 22, type_engin: 1 },
  { id: 100, nom: "BOXER", marque_id: 22, type_engin: 1 },
  
  // ISUZU (id: 30) - Voiture/Utilitaire
  { id: 101, nom: "D-MAX", marque_id: 30, type_engin: 1 },
  { id: 102, nom: "N-SERIES", marque_id: 30, type_engin: 4 },
  { id: 103, nom: "F-SERIES", marque_id: 30, type_engin: 2 },
  { id: 104, nom: "FRR", marque_id: 30, type_engin: 2 },
  { id: 105, nom: "FSR", marque_id: 30, type_engin: 2 },
  { id: 106, nom: "FTR", marque_id: 30, type_engin: 2 },
  { id: 107, nom: "FVR", marque_id: 30, type_engin: 2 },
];

export const couleursData: string[] = [
  "Noir",
  "Blanc",
  "Rouge",
  "Bleu",
  "Vert",
  "Jaune",
  "Orange",
  "Gris",
  "Argent",
  "Marron",
  "Beige",
  "Bordeaux",
  "Or",
  "Violet",
  "Rose",
  "Bleu Nuit",
  "Gris Anthracite",
  "Bleu Métallisé",
  "Rouge Métallisé",
  "Vert Métallisé",
  "Noir Métallisé",
  "Blanc Perle",
  "Cuivre",
];