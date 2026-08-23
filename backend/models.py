from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class Commodity(BaseModel):
    id: str
    name: str
    hindiName: str
    marathiName: str
    icon: str
    category: Literal['Cereal', 'Oilseed', 'Vegetable', 'Cash Crop', 'Pulse']
    currentAvgPrice: float
    unit: str = "Quintal"
    change24h: float
    msp: float
    moistureStandardPercent: float
    shelfLifeDays: int
    varieties: List[str]

class MandiMarket(BaseModel):
    id: str
    name: str
    district: str
    state: str
    distanceKm: int
    modalPrice: float
    minPrice: float
    maxPrice: float
    arrivalTodayQuintals: int
    arrivalTrendPercent: float
    verifiedBuyersCount: int
    storageCapacityAvailableQuintals: int
    coldStorageAvailable: bool
    rating: float
    mandiCessPercent: float = 1.0
    avgHandlingCostPerQuintal: float = 18.0

class VerifiedBuyer(BaseModel):
    id: str
    name: str
    companyName: str
    type: Literal['Processor', 'Flour Mill', 'Institutional Exporter', 'FMCG Corporate', 'FPO Aggregator']
    mandiId: str
    offeredRatePerQuintal: float
    minVolumeQuintals: int
    maxVolumeQuintals: int
    qualitySpecs: str
    paymentReliabilityPercent: int
    rating: float
    reviewsCount: int
    verifiedBadge: bool
    isoCertified: bool
    deliveryLocation: str
    acceptedCrops: List[str]
    maxMoistureAllowed: float
    avgPaymentReleaseHours: int

class DispatchDetails(BaseModel):
    transporterName: str
    truckType: str
    licensePlate: str
    driverName: str
    driverPhone: str
    dispatchDate: str
    etaMinutes: int
    originLocation: str
    destinationMandi: str
    distanceKm: int
    freightAgreedAmount: float
    gatePassId: str
    currentGpsProgressPercent: int

class PaymentReceipt(BaseModel):
    receiptId: str
    orderId: str
    utrNumber: str
    bankName: str
    accountMasked: str
    grossAmount: float
    freightDeduction: float
    handlingAndCess: float
    netCreditedAmount: float
    payoutTimestamp: str
    status: Literal['credited', 'processing'] = 'credited'
    commissionCutPercent: float = 0.0

class OrderRequest(BaseModel):
    id: str
    cropId: str
    cropName: str
    variety: str
    quantityQuintals: float
    proposedPricePerQuintal: float
    counterOfferPrice: Optional[float] = None
    farmerId: str
    farmerName: str
    farmerPhone: str
    farmerLocation: str
    farmerDistrict: str
    buyerId: str
    buyerName: str
    buyerCompany: str
    targetMarketId: str
    targetMarketName: str
    status: Literal['pending', 'accepted', 'countered', 'rejected', 'dispatched', 'delivered', 'settled']
    orderOrigin: Literal['farmer_proposal', 'buyer_direct_po'] = 'farmer_proposal'
    moisturePercent: float
    expectedLossPercent: float
    qualityGrade: str
    grossAmount: float
    freightCost: float
    calculatedNetRealization: float
    farmerNotes: Optional[str] = None
    buyerNotes: Optional[str] = None
    createdAt: str
    dispatchDetails: Optional[DispatchDetails] = None
    paymentReceipt: Optional[PaymentReceipt] = None

class CreateProposalRequest(BaseModel):
    cropId: str
    cropName: str
    variety: str
    quantityQuintals: float
    proposedPricePerQuintal: float
    farmerId: str
    farmerName: str
    farmerPhone: str
    farmerLocation: str
    farmerDistrict: str
    buyerId: str
    buyerName: str
    buyerCompany: str
    targetMarketId: str
    targetMarketName: str
    moisturePercent: float = 12.0
    expectedLossPercent: float = 2.0
    qualityGrade: str = "Grade A (Export)"
    farmerNotes: Optional[str] = None

class CreateDirectPoRequest(BaseModel):
    farmerId: str
    farmerName: str
    farmerPhone: str
    farmerLocation: str
    farmerDistrict: str
    cropId: str
    cropName: str
    variety: str
    quantityQuintals: float
    proposedPricePerQuintal: float
    buyerId: str
    buyerName: str
    buyerCompany: str
    buyerNotes: Optional[str] = None

class CounterOfferRequest(BaseModel):
    counterPrice: float
    notes: Optional[str] = None

class DispatchOrderRequest(BaseModel):
    transporterName: str
    truckType: str
    licensePlate: str
    driverName: str
    driverPhone: str
    distanceKm: int
    freightRate: float

class RealizationPredictRequest(BaseModel):
    cropId: str
    quantityQuintals: float = 75.0
    expectedLossPercent: float = 2.0
    qualityGrade: Literal['Grade A (Export)', 'Grade B (Premium)', 'Grade C (Standard)'] = 'Grade A (Export)'
    maxDistanceKm: int = 300

class MarketRealizationItem(BaseModel):
    mandi: MandiMarket
    grossPricePerQuintal: float
    effectiveVolumeQuintals: float
    grossRealization: float
    freightCost: float
    handlingCost: float
    lossValue: float
    netRealization: float
    netRatePerQuintal: float
    isRecommended: bool
    gainVsLocal: float

class PriceForecastPoint(BaseModel):
    day: str
    date: str
    actualPrice: Optional[float] = None
    forecastPrice: float
    lowerConfidence: float
    upperConfidence: float
    arrivalVolume: int

class ForecastResponse(BaseModel):
    cropId: str
    cropName: str
    currentAvgPrice: float
    points: List[PriceForecastPoint]
    decisionAdvisory: Literal['STORE', 'SELL']
    advisoryText: str
    confidencePercent: int
    estimatedGainPerQtl: float
