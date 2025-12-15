// data/mockData.ts
export interface Vehicle {
  plateNumber: string;
  oldPlateNumber?: string;
  brand: string;
  model: string;
  energy: string;
  manufactureYear: number;
  circulationYear: number;
  color: string;
  fiscalPower: number;
  usage: string;
  engineNumber: string;
  chassisNumber: string;
}

export interface Purchase {
  plateNumber: string;
  brand: string;
  model: string;
  energy: 'Essence' | 'Diesel' | 'Électrique' | 'Hybride';
  manufactureYear: number;
  circulationYear: number;
  color: string;
  fiscalPower: number;
  usage: string;
  engineNumber: string;
  chassisNumber: string;
}

export interface DetailSale {
  id: string;
  fullName: string;
  address: string;
  phone: string;
  totalAmount: number;
  purchases: Purchase[];
}

export interface WholesaleSale {
  id: string;
  companyName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  platesPurchased: number;
  totalAmount: number;
  plates: string[];
}

export interface ReproductionSale {
  id: string;
  fullName: string;
  oldPlateNumber: string;
  address: string;
  phone: string;
  reason: string;
  amount: number;
  vehicle: Vehicle;
}

export const detailSalesData: DetailSale[] = [
  {
    id: 'DET-001',
    fullName: 'Jean Kabasele',
    address: 'Avenue de la Justice, 123 - Kinshasa',
    phone: '+243 81 123 4567',
    totalAmount: 450000,
    purchases: [
      {
        plateNumber: '6AB123CD',
        brand: 'Toyota',
        model: 'Hilux',
        energy: 'Diesel',
        manufactureYear: 2022,
        circulationYear: 2023,
        color: 'Blanc',
        fiscalPower: 12,
        usage: 'Transport',
        engineNumber: '2KD1234567',
        chassisNumber: 'MNB123C4567890',
      },
      {
        plateNumber: '6EF456GH',
        brand: 'Honda',
        model: 'CR-V',
        energy: 'Essence',
        manufactureYear: 2021,
        circulationYear: 2022,
        color: 'Noir',
        fiscalPower: 10,
        usage: 'Personnel',
        engineNumber: 'K24A123456',
        chassisNumber: 'JHL1234567890',
      },
    ],
  },
  {
    id: 'DET-002',
    fullName: 'Marie-Louise Mbayo',
    address: 'Boulevard du 30 Juin, 456 - Gombe',
    phone: '+243 89 987 6543',
    totalAmount: 320000,
    purchases: [
      {
        plateNumber: '6IJ789KL',
        brand: 'Ford',
        model: 'Ranger',
        energy: 'Diesel',
        manufactureYear: 2023,
        circulationYear: 2023,
        color: 'Bleu',
        fiscalPower: 14,
        usage: 'Commercial',
        engineNumber: 'P5AT123456',
        chassisNumber: 'MFB123C4567891',
      },
    ],
  },
];

export const wholesaleSalesData: WholesaleSale[] = [
  {
    id: 'WHO-001',
    companyName: 'Auto Parts SARL',
    registrationNumber: 'RC123456789',
    address: 'Zone industrielle, Limete - Kinshasa',
    phone: '+243 82 111 2233',
    platesPurchased: 25,
    totalAmount: 1250000,
    plates: [
      '6MN123OP', '6QR456ST', '6UV789WX', '6YZ012AB', '6CD345EF',
      '6GH678IJ', '6KL901MN', '6OP234QR', '6ST567UV', '6WX890YZ',
    ],
  },
  {
    id: 'WHO-002',
    companyName: 'Moto Distribution Congo',
    registrationNumber: 'RC987654321',
    address: 'Avenue des Aviateurs, 789 - Gombe',
    phone: '+243 84 555 6677',
    platesPurchased: 15,
    totalAmount: 750000,
    plates: [
      '6AB789CD', '6EF012GH', '6IJ345KL', '6MN678OP', '6QR901ST',
    ],
  },
];

export const reproductionSalesData: ReproductionSale[] = [
  {
    id: 'REP-001',
    fullName: 'Patrick Nkashama',
    oldPlateNumber: '6XX123YY',
    address: 'Commune de Ngaliema, Kinshasa',
    phone: '+243 81 444 5566',
    reason: 'Plaque détériorée',
    amount: 150000,
    vehicle: {
      plateNumber: '6ZZ789AA',
      oldPlateNumber: '6XX123YY',
      brand: 'Mercedes-Benz',
      model: 'Classe C',
      energy: 'Diesel',
      manufactureYear: 2020,
      circulationYear: 2021,
      color: 'Gris',
      fiscalPower: 11,
      usage: 'Personnel',
      engineNumber: 'OM654123456',
      chassisNumber: 'WDD1234567890',
    },
  },
  {
    id: 'REP-002',
    fullName: 'Sarah Kalala',
    oldPlateNumber: '6BB456CC',
    address: 'Avenue de la Révolution, Lubumbashi',
    phone: '+243 99 777 8889',
    reason: 'Vol de plaque',
    amount: 180000,
    vehicle: {
      plateNumber: '6DD789EE',
      oldPlateNumber: '6BB456CC',
      brand: 'BMW',
      model: 'X5',
      energy: 'Essence',
      manufactureYear: 2022,
      circulationYear: 2022,
      color: 'Noir',
      fiscalPower: 13,
      usage: 'Personnel',
      engineNumber: 'B58B30M123456',
      chassisNumber: 'WBA1234567890',
    },
  },
];