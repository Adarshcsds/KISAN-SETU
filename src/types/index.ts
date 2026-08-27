export type Role = 'farmer' | 'buyer' | 'logistics' | 'fpo' | 'admin';

export type Language = 'en' | 'hi' | 'mr' | 'pa' | 'te';

export type QualityGrade = 'Grade A (Export)' | 'Grade B (Premium)' | 'Grade C (Standard)';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  location: string;
  district: string;
  state: string;
  pinCode?: string;
  farmSizeAcres?: number;
  primaryCrops?: string[];
  companyName?: string;
  buyerType?: string;
  gstNumber?: string;
  fpoMemberCount?: number;
  businessAddress?: string;
  vehicleTypes?: string[];
  vehicleCapacity?: string;
  serviceAreas?: string[];
  verified: boolean;
  avatarUrl?: string;
  walletBalance?: number;
}

export interface Commodity {
  id: string;
  name: string;
  hindiName: string;
  category: 'Cereal' | 'Pulse' | 'Oilseed' | 'Commercial' | 'Vegetable' | 'Spice';
  icon: string;
  currentAvgPrice: number; // per quintal
  unit: string;
  change24h: number; // percentage
  highPrice: number;
  lowPrice: number;
  msp: number; // Minimum Support Price
  moistureStandardPercent: number;
  varieties: string[];
  shelfLifeDays: number;
  lossRatePer100KmPercent: number;
}

export interface MandiMarket {
  id: string;
  name: string;
  state: string;
  district: string;
  distanceKm: number;
  arrivalTodayQuintals: number;
  arrivalTrendPercent: number;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  storageCapacityAvailableQuintals: number;
  coldStorageAvailable: boolean;
  rating: number;
  verifiedBuyersCount: number;
  mandiCessPercent: number;
  avgHandlingCostPerQuintal: number;
}

export interface VerifiedBuyer {
  id: string;
  name: string;
  companyName: string;
  mandiId: string;
  mandiName: string;
  type: 'Processor' | 'Flour Mill' | 'Institutional Exporter' | 'FMCG Corporate' | 'Wholesale Trader';
  acceptedCrops: string[];
  minVolumeQuintals: number;
  maxVolumeQuintals: number;
  offeredRatePerQuintal: number;
  paymentReliabilityPercent: number;
  rating: number;
  reviewsCount: number;
  qualitySpecs: string;
  maxMoistureAllowed: number;
  verifiedBadge: boolean;
  isoCertified: boolean;
  contactPerson: string;
  phone: string;
  deliveryLocation: string;
  avgPaymentReleaseHours: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'countered' | 'rejected' | 'dispatched' | 'delivered' | 'settled';

export interface PaymentReceipt {
  utrNumber: string;
  bankName: string;
  accountNumberMasked: string;
  grossAmount: number;
  freightDeducted: number;
  handlingDeducted: number;
  netCreditedAmount: number;
  settledAtTimestamp: string;
  paymentMode: 'Instant Escrow IMPS' | 'UPI AutoPay' | 'e-Rupee Direct';
  assayerGradeCertified: string;
}

export interface OrderRequest {
  id: string;
  orderOrigin: 'farmer_proposal' | 'buyer_direct_po';
  farmerName: string;
  farmerPhone: string;
  farmerLocation: string;
  farmerDistrict: string;
  cropId: string;
  cropName: string;
  variety: string;
  quantityQuintals: number;
  qualityGrade: QualityGrade;
  moisturePercent: number;
  expectedLossPercent: number;
  proposedPricePerQuintal: number;
  grossAmount: number;
  freightCost: number;
  handlingCost: number;
  calculatedNetRealization: number;
  targetMarketId: string;
  targetMarketName: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  status: OrderStatus;
  counterPricePerQuintal?: number;
  buyerNotes?: string;
  farmerNotes?: string;
  createdAt: string;
  acceptedAt?: string;
  dispatchedAt?: string;
  settledAt?: string;
  dispatchDetails?: DispatchDetails;
  paymentReceipt?: PaymentReceipt;
}

export interface Transporter {
  id: string;
  name: string;
  truckType: string;
  capacityQuintals: number;
  licensePlate: string;
  driverName: string;
  driverPhone: string;
  ratePerKm: number;
  rating: number;
  verified: boolean;
}

export interface DispatchDetails {
  orderId: string;
  transporterId: string;
  transporterName: string;
  truckType: string;
  licensePlate: string;
  driverName: string;
  driverPhone: string;
  grossWeightQuintals: number;
  tareWeightQuintals: number;
  netWeightQuintals: number;
  checklist: {
    grossVerified: boolean;
    tareChecked: boolean;
    netConfirmed: boolean;
    loadingSupervised: boolean;
    goodsCovered: boolean;
    digitalSealApplied: boolean;
  };
  qrCodeData: string;
  ewayBillNumber: string;
  gatePassId: string;
  status: 'assigned' | 'loading' | 'in_transit' | 'reached_gate' | 'unloaded';
  currentGpsProgressPercent: number;
  originLocation: string;
  destinationLocation: string;
  etaMinutes: number;
  distanceKm: number;
}

export interface PriceForecastPoint {
  day: string;
  date: string;
  actualPrice?: number;
  forecastPrice: number;
  lowerConfidence: number;
  upperConfidence: number;
  arrivalVolume: number;
}

export interface StorageFacility {
  id: string;
  name: string;
  type: 'Dry Warehouse' | 'Cold Storage' | 'Silo Complex';
  location: string;
  distanceKm: number;
  totalCapacityQuintals: number;
  availableQuintals: number;
  ratePerQuintalPerMonth: number;
  wdraCertified: boolean;
  temperatureC?: string;
  rating: number;
  phone: string;
}
