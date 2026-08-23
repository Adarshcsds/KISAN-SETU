import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Role, 
  Language, 
  Commodity, 
  MandiMarket, 
  VerifiedBuyer, 
  Transporter, 
  StorageFacility, 
  OrderRequest, 
  DispatchDetails,
  User
} from '../types';
import { 
  COMMODITIES, 
  MANDI_MARKETS, 
  VERIFIED_BUYERS, 
  TRANSPORTERS, 
  STORAGE_FACILITIES, 
  INITIAL_ORDERS 
} from '../data/mockData';
import { DEFAULT_USERS } from '../data/mockUsers';
import { TRANSLATIONS } from '../utils/translations';
import confetti from 'canvas-confetti';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  roleTarget: Role | 'all';
  type: 'order_received' | 'order_accepted' | 'dispatched' | 'payment' | 'alert';
  read: boolean;
  orderId?: string;
}

interface AppContextType {
  currentUser: User;
  usersList: User[];
  loginUser: (user: User) => void;
  registerUser: (userData: Partial<User>) => User;
  logoutUser: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register' | 'forgot_password';
  setAuthModalMode: (mode: 'login' | 'register' | 'forgot_password') => void;

  role: Role;
  setRole: (role: Role) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  
  commodities: Commodity[];
  selectedCropId: string;
  setSelectedCropId: (id: string) => void;
  selectedCrop: Commodity;
  
  mandis: MandiMarket[];
  selectedMandiId: string | null;
  setSelectedMandiId: (id: string | null) => void;
  selectedMandi: MandiMarket | null;
  
  buyers: VerifiedBuyer[];
  transporters: Transporter[];
  storages: StorageFacility[];
  
  orders: OrderRequest[];
  createOrderRequest: (orderData: Partial<OrderRequest>) => OrderRequest;
  placeDirectBuyerOrder: (buyerOrderData: {
    farmerId?: string;
    farmerName: string;
    farmerPhone: string;
    farmerLocation: string;
    farmerDistrict: string;
    cropId: string;
    cropName: string;
    variety: string;
    quantityQuintals: number;
    proposedPricePerQuintal: number;
    buyerId: string;
    buyerName: string;
    buyerCompany: string;
    buyerNotes?: string;
  }) => OrderRequest;
  farmerAcceptBuyerOrder: (orderId: string) => void;
  acceptOrder: (orderId: string, notes?: string) => void;
  counterOrder: (orderId: string, counterPrice: number, notes?: string) => void;
  rejectOrder: (orderId: string, reason?: string) => void;
  dispatchVehicle: (orderId: string, dispatchData: Partial<DispatchDetails>) => void;
  settlePayment: (orderId: string) => void;
  
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;

  // Active view control
  activeTab: string;
  setActiveTab: (tab: string) => void;
  viewingMandiBuyers: MandiMarket | null;
  setViewingMandiBuyers: (mandi: MandiMarket | null) => void;
  dispatchingOrderId: string | null;
  setDispatchingOrderId: (orderId: string | null) => void;

  // Wallet / Escrow
  farmerWalletBalance: number;
  buyerEscrowLocked: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = localStorage.getItem('kisansetu_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('kisansetu_current_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0]; // Default: Rajesh
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot_password'>('login');

  const [role, setRole] = useState<Role>(currentUser.role || 'farmer');
  const [language, setLanguage] = useState<Language>('en');
  const [selectedCropId, setSelectedCropId] = useState<string>('wheat');
  const [selectedMandiId, setSelectedMandiId] = useState<string | null>('mandi-pune');
  const [orders, setOrders] = useState<OrderRequest[]>(() => {
    const saved = localStorage.getItem('kisansetu_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [viewingMandiBuyers, setViewingMandiBuyers] = useState<MandiMarket | null>(null);
  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('kisansetu_users', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('kisansetu_current_user', JSON.stringify(currentUser));
    setRole(currentUser.role);
  }, [currentUser]);

  const loginUser = (user: User) => {
    setCurrentUser(user);
    setRole(user.role);
    setIsAuthModalOpen(false);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  const registerUser = (userData: Partial<User>): User => {
    const newUserId = `usr-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: userData.name || 'New Member',
      phone: userData.phone || '9999999999',
      email: userData.email || '',
      role: userData.role || 'farmer',
      location: userData.location || 'Local Village',
      district: userData.district || 'Nashik',
      state: userData.state || 'Maharashtra',
      pinCode: userData.pinCode || '422001',
      farmSizeAcres: userData.farmSizeAcres || 5.0,
      primaryCrops: userData.primaryCrops || ['wheat', 'soyabean'],
      companyName: userData.companyName || '',
      buyerType: userData.buyerType || '',
      gstNumber: userData.gstNumber || '',
      fpoMemberCount: userData.fpoMemberCount || 50,
      verified: true,
      avatarUrl: userData.role === 'farmer' ? '👨‍🌾' : userData.role === 'buyer' ? '🏢' : userData.role === 'fpo' ? '👥' : '⚖️',
      walletBalance: 0,
    };

    setUsersList(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setRole(newUser.role);
    setIsAuthModalOpen(false);

    confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
    return newUser;
  };

  const logoutUser = () => {
    // Reset to public guest or Rajesh
    setCurrentUser(DEFAULT_USERS[0]);
    setRole('farmer');
  };

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Order Accepted!',
      message: 'Sahyadri Agro Processing accepted your 110 Qtl Soyabean order. You can now load the vehicle.',
      timestamp: '45m ago',
      roleTarget: 'farmer',
      type: 'order_accepted',
      read: false,
      orderId: 'ORD-9840'
    },
    {
      id: 'notif-2',
      title: 'New Sell Request Received',
      message: 'Farmer Rajesh Kumar sent a request for 75 Qtl Lokwan Wheat at ₹2,470/Qtl.',
      timestamp: '10m ago',
      roleTarget: 'buyer',
      type: 'order_received',
      read: false,
      orderId: 'ORD-9842'
    }
  ]);

  useEffect(() => {
    localStorage.setItem('kisansetu_orders', JSON.stringify(orders));
  }, [orders]);

  // Live GPS progression simulation for in-transit trucks
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.status === 'dispatched' && order.dispatchDetails) {
            const currentProgress = order.dispatchDetails.currentGpsProgressPercent || 0;
            if (currentProgress < 100) {
              const newProgress = Math.min(100, currentProgress + 1);
              const remainingEta = Math.max(0, Math.round((100 - newProgress) * 0.8));
              return {
                ...order,
                dispatchDetails: {
                  ...order.dispatchDetails,
                  currentGpsProgressPercent: newProgress,
                  etaMinutes: remainingEta,
                  status: newProgress >= 100 ? 'reached_gate' : 'in_transit',
                }
              };
            }
          }
          return order;
        })
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const selectedCrop = COMMODITIES.find(c => c.id === selectedCropId) || COMMODITIES[0];
  const selectedMandi = MANDI_MARKETS.find(m => m.id === selectedMandiId) || MANDI_MARKETS[0];

  const createOrderRequest = (orderData: Partial<OrderRequest>): OrderRequest => {
    const newId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: OrderRequest = {
      id: newId,
      orderOrigin: orderData.orderOrigin || 'farmer_proposal',
      farmerName: orderData.farmerName || 'Rajesh Kumar Patel',
      farmerPhone: '+91 98224 55192',
      farmerLocation: orderData.farmerLocation || 'Niphad Village, Nashik',
      farmerDistrict: 'Nashik',
      cropId: orderData.cropId || selectedCrop.id,
      cropName: orderData.cropName || selectedCrop.name,
      variety: orderData.variety || selectedCrop.varieties[0],
      quantityQuintals: orderData.quantityQuintals || 75,
      qualityGrade: orderData.qualityGrade || 'Grade A (Export)',
      moisturePercent: orderData.moisturePercent || 11.5,
      expectedLossPercent: orderData.expectedLossPercent || 2.0,
      proposedPricePerQuintal: orderData.proposedPricePerQuintal || selectedCrop.currentAvgPrice,
      grossAmount: (orderData.quantityQuintals || 75) * (orderData.proposedPricePerQuintal || selectedCrop.currentAvgPrice),
      freightCost: orderData.freightCost || 1800,
      handlingCost: orderData.handlingCost || 1500,
      calculatedNetRealization: orderData.calculatedNetRealization || 178000,
      targetMarketId: orderData.targetMarketId || selectedMandi.id,
      targetMarketName: orderData.targetMarketName || selectedMandi.name,
      buyerId: orderData.buyerId || 'buyer-agrocorp',
      buyerName: orderData.buyerName || 'AgroCorp Grain Mill & Processing',
      buyerCompany: orderData.buyerCompany || 'AgroCorp India Ltd.',
      status: 'pending',
      farmerNotes: orderData.farmerNotes || '',
      createdAt: 'Just now',
    };

    setOrders(prev => [newOrder, ...prev]);

    // Push notification for buyer
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Farmer Order Request Received',
        message: `${newOrder.farmerName} submitted a trade offer for ${newOrder.quantityQuintals} Qtl ${newOrder.cropName} at ₹${newOrder.proposedPricePerQuintal}/Qtl.`,
        timestamp: 'Just now',
        roleTarget: 'buyer',
        type: 'order_received',
        read: false,
        orderId: newId,
      },
      ...prev
    ]);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    return newOrder;
  };

  const acceptOrder = (orderId: string, notes?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'accepted',
          acceptedAt: 'Just now',
          buyerNotes: notes || 'Quality specifications approved. Please dispatch vehicle at the earliest.',
        };
      }
      return order;
    }));

    const targetOrder = orders.find(o => o.id === orderId);

    // Notify farmer
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: '🎉 Order Accepted by Buyer!',
        message: `${targetOrder?.buyerCompany || 'Buyer'} accepted your order ${orderId} for ${targetOrder?.quantityQuintals} Qtl ${targetOrder?.cropName}. You can now load your vehicle.`,
        timestamp: 'Just now',
        roleTarget: 'farmer',
        type: 'order_accepted',
        read: false,
        orderId: orderId,
      },
      ...prev
    ]);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const counterOrder = (orderId: string, counterPrice: number, notes?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'countered',
          counterPricePerQuintal: counterPrice,
          buyerNotes: notes || `Counter offer proposed at ₹${counterPrice}/Qtl based on current market rate.`,
        };
      }
      return order;
    }));
  };

  const rejectOrder = (orderId: string, reason?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'rejected',
          buyerNotes: reason || 'Specifications do not match current batch requirement.',
        };
      }
      return order;
    }));
  };

  const dispatchVehicle = (orderId: string, dispatchData: Partial<DispatchDetails>) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const transporter = TRANSPORTERS.find(t => t.id === dispatchData.transporterId) || TRANSPORTERS[0];

    const dispatchRecord: DispatchDetails = {
      orderId,
      transporterId: transporter.id,
      transporterName: transporter.name,
      truckType: transporter.truckType,
      licensePlate: transporter.licensePlate,
      driverName: transporter.driverName,
      driverPhone: transporter.driverPhone,
      grossWeightQuintals: (targetOrder?.quantityQuintals || 75) + 40,
      tareWeightQuintals: 40,
      netWeightQuintals: targetOrder?.quantityQuintals || 75,
      checklist: {
        grossVerified: true,
        tareChecked: true,
        netConfirmed: true,
        loadingSupervised: true,
        goodsCovered: true,
        digitalSealApplied: true,
      },
      qrCodeData: `KISANSETU-PASS-${orderId}-${transporter.licensePlate.replace(/\s+/g, '')}`,
      ewayBillNumber: `EWB-2026-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      gatePassId: `GP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'in_transit',
      currentGpsProgressPercent: 5,
      originLocation: targetOrder?.farmerLocation || 'Farm Gate, Nashik',
      destinationLocation: targetOrder?.targetMarketName || 'Pune APMC Mandi',
      etaMinutes: 110,
      distanceKm: 58,
    };

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'dispatched',
          dispatchedAt: 'Just now',
          dispatchDetails: dispatchRecord,
        };
      }
      return order;
    }));

    // Notify Buyer that truck is en route
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: '🚚 Inbound Vehicle Dispatched!',
        message: `${targetOrder?.farmerName} has loaded vehicle (${transporter.licensePlate}) with ${targetOrder?.quantityQuintals} Qtl ${targetOrder?.cropName}. Live tracking is active.`,
        timestamp: 'Just now',
        roleTarget: 'buyer',
        type: 'dispatched',
        read: false,
        orderId: orderId,
      },
      ...prev
    ]);

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });
  };

  const placeDirectBuyerOrder = (buyerOrderData: {
    farmerId?: string;
    farmerName: string;
    farmerPhone: string;
    farmerLocation: string;
    farmerDistrict: string;
    cropId: string;
    cropName: string;
    variety: string;
    quantityQuintals: number;
    proposedPricePerQuintal: number;
    buyerId: string;
    buyerName: string;
    buyerCompany: string;
    buyerNotes?: string;
  }): OrderRequest => {
    const newId = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
    const gross = buyerOrderData.quantityQuintals * buyerOrderData.proposedPricePerQuintal;
    const freight = Math.round(500 + 58 * 26);
    const handling = Math.round(buyerOrderData.quantityQuintals * 22);
    const net = gross - freight - handling;

    const newPo: OrderRequest = {
      id: newId,
      orderOrigin: 'buyer_direct_po',
      farmerName: buyerOrderData.farmerName,
      farmerPhone: buyerOrderData.farmerPhone,
      farmerLocation: buyerOrderData.farmerLocation,
      farmerDistrict: buyerOrderData.farmerDistrict,
      cropId: buyerOrderData.cropId,
      cropName: buyerOrderData.cropName,
      variety: buyerOrderData.variety,
      quantityQuintals: buyerOrderData.quantityQuintals,
      qualityGrade: 'Grade A (Export)',
      moisturePercent: 11.2,
      expectedLossPercent: 1.5,
      proposedPricePerQuintal: buyerOrderData.proposedPricePerQuintal,
      grossAmount: gross,
      freightCost: freight,
      handlingCost: handling,
      calculatedNetRealization: net,
      targetMarketId: 'mandi-pune',
      targetMarketName: 'Pune APMC Mandi & Trade Hub',
      buyerId: buyerOrderData.buyerId,
      buyerName: buyerOrderData.buyerName,
      buyerCompany: buyerOrderData.buyerCompany,
      status: 'pending',
      buyerNotes: buyerOrderData.buyerNotes || `Direct Purchase Order from ${buyerOrderData.buyerCompany} for ${buyerOrderData.quantityQuintals} Qtl ${buyerOrderData.cropName} at ₹${buyerOrderData.proposedPricePerQuintal}/Qtl.`,
      createdAt: 'Just now',
    };

    setOrders(prev => [newPo, ...prev]);

    // Push notification for Farmer
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: '📦 Direct Buy Order Received from Buyer!',
        message: `${newPo.buyerCompany} placed a Purchase Order for ${newPo.quantityQuintals} Qtl ${newPo.cropName} @ ₹${newPo.proposedPricePerQuintal}/Qtl (Net: ₹${newPo.calculatedNetRealization.toLocaleString('en-IN')}).`,
        timestamp: 'Just now',
        roleTarget: 'farmer',
        type: 'order_received',
        read: false,
        orderId: newId,
      },
      ...prev
    ]);

    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    return newPo;
  };

  const farmerAcceptBuyerOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'accepted',
          acceptedAt: 'Just now',
        };
      }
      return order;
    }));

    const targetOrder = orders.find(o => o.id === orderId);

    // Notify Buyer that farmer accepted their PO
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: '✅ Farmer Accepted Purchase Order!',
        message: `${targetOrder?.farmerName} accepted your PO ${orderId} for ${targetOrder?.quantityQuintals} Qtl ${targetOrder?.cropName}. Escrow funds locked.`,
        timestamp: 'Just now',
        roleTarget: 'buyer',
        type: 'order_accepted',
        read: false,
        orderId: orderId,
      },
      ...prev
    ]);

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const settlePayment = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const mockUtr = `UTR-HDFC-${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;

    const paymentReceipt = {
      utrNumber: mockUtr,
      bankName: 'HDFC Bank - Rural Branch',
      accountNumberMasked: 'XXXX-XXXX-4812',
      grossAmount: targetOrder?.grossAmount || 185250,
      freightDeducted: targetOrder?.freightCost || 1624,
      handlingDeducted: targetOrder?.handlingCost || 1875,
      netCreditedAmount: targetOrder?.calculatedNetRealization || 181751,
      settledAtTimestamp: 'Just now',
      paymentMode: 'Instant Escrow IMPS' as const,
      assayerGradeCertified: `${targetOrder?.qualityGrade || 'Grade A'} Certified`,
    };

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'settled',
          settledAt: 'Just now',
          paymentReceipt,
        };
      }
      return order;
    }));

    // Alert Farmer
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: '💰 Payment Settled to Bank Account!',
        message: `₹${paymentReceipt.netCreditedAmount.toLocaleString('en-IN')} has been credited directly to your bank account (${paymentReceipt.bankName}). Ref: ${mockUtr}`,
        timestamp: 'Just now',
        roleTarget: 'farmer',
        type: 'payment',
        read: false,
        orderId: orderId,
      },
      ...prev
    ]);

    // Alert Buyer
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}-buyer`,
        title: '✅ Escrow Payment Released to Farmer',
        message: `Payment of ₹${paymentReceipt.netCreditedAmount.toLocaleString('en-IN')} for batch ${orderId} was successfully released from Escrow to ${targetOrder?.farmerName}.`,
        timestamp: 'Just now',
        roleTarget: 'buyer',
        type: 'payment',
        read: false,
        orderId: orderId,
      },
      ...prev
    ]);

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 }
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read && (n.roleTarget === role || n.roleTarget === 'all')).length;

  // Computed balances
  const farmerWalletBalance = orders
    .filter(o => o.status === 'settled')
    .reduce((sum, o) => sum + o.calculatedNetRealization, 345000);

  const buyerEscrowLocked = orders
    .filter(o => o.status === 'accepted' || o.status === 'dispatched')
    .reduce((sum, o) => sum + o.grossAmount, 6500000);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        usersList,
        loginUser,
        registerUser,
        logoutUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,

        role,
        setRole,
        language,
        setLanguage,
        t,
        commodities: COMMODITIES,
        selectedCropId,
        setSelectedCropId,
        selectedCrop,
        mandis: MANDI_MARKETS,
        selectedMandiId,
        setSelectedMandiId,
        selectedMandi,
        buyers: VERIFIED_BUYERS,
        transporters: TRANSPORTERS,
        storages: STORAGE_FACILITIES,
        orders,
        createOrderRequest,
        placeDirectBuyerOrder,
        farmerAcceptBuyerOrder,
        acceptOrder,
        counterOrder,
        rejectOrder,
        dispatchVehicle,
        settlePayment,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        unreadCount,
        activeTab,
        setActiveTab,
        viewingMandiBuyers,
        setViewingMandiBuyers,
        dispatchingOrderId,
        setDispatchingOrderId,
        farmerWalletBalance,
        buyerEscrowLocked,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
