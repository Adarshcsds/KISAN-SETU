/**
 * KisanSetu FastAPI Backend Integration Client
 * Base URL: http://127.0.0.1:8000/api
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface AuthUserResponse {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'farmer' | 'buyer' | 'logistics';
  profile: Record<string, unknown>;
}

async function authRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}/auth${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Authentication request failed');
  return body;
}

async function protectedRequest(path: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Request failed');
  return body;
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  ml_engine: string;
  data_store: string;
}

export interface ChatResponse {
  reply: string;
  intent:
  | 'GENERAL_CROP'
  | 'PLANTING'
  | 'ORDER_STATUS'
  | 'SHIPMENT_STATUS'
  | 'PROFIT'
  | 'PRICE_FORECAST'
  | 'UNKNOWN';
}

export const KisanSetuApi = {
  register: (payload: { name: string; phone: string; email?: string; password: string; role: AuthUserResponse['role']; profile: Record<string, unknown> }) => authRequest('/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (identifier: string, password: string) => authRequest('/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  me: (token: string): Promise<AuthUserResponse> => authRequest('/me', { headers: { Authorization: `Bearer ${token}` } }),
  getDemands: (token: string) => protectedRequest('/demands', token),
  createDemand: (token: string, payload: unknown) => protectedRequest('/demands', token, { method: 'POST', body: JSON.stringify(payload) }),
  getDemandOffers: (token: string, demandId: string) => protectedRequest(`/demands/${demandId}/offers`, token),
  createDemandOffer: (token: string, demandId: string, payload: unknown) => protectedRequest(`/demands/${demandId}/offers`, token, { method: 'POST', body: JSON.stringify(payload) }),
  getMyOffers: (token: string) => protectedRequest('/offers', token),
  respondToOffer: (token: string, offerId: string, action: 'accept' | 'reject' | 'counter', payload?: unknown) => protectedRequest(`/offers/${offerId}/${action}`, token, { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }),
  getDeals: (token: string) => protectedRequest('/demands/deals', token),
  chat: (message: string): Promise<ChatResponse> => {
    const token = localStorage.getItem('kisansetu_access_token') || '';
    return protectedRequest('/chat', token, { method: 'POST', body: JSON.stringify({ message }) });
  },
  // 1. Health check
  checkHealth: async (): Promise<BackendHealthResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // 2. Fetch all commodities
  getCommodities: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/commodities`);
      if (!res.ok) throw new Error('Failed to fetch commodities');
      return await res.json();
    } catch (e) {
      console.warn('[KisanSetuApi] Fallback to local commodities', e);
      return null;
    }
  },

  // 3. Fetch APMC Mandis
  getMandis: async (maxDistance?: number) => {
    try {
      const url = maxDistance 
        ? `${API_BASE_URL}/mandis?max_distance=${maxDistance}` 
        : `${API_BASE_URL}/mandis`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch mandis');
      return await res.json();
    } catch (e) {
      console.warn('[KisanSetuApi] Fallback to local mandis', e);
      return null;
    }
  },

  // 4. Fetch Verified Buyers
  getBuyers: async (mandiId?: string, cropId?: string) => {
    try {
      const params = new URLSearchParams();
      if (mandiId) params.append('mandi_id', mandiId);
      if (cropId) params.append('crop_id', cropId);
      const url = `${API_BASE_URL}/buyers?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch buyers');
      return await res.json();
    } catch (e) {
      console.warn('[KisanSetuApi] Fallback to local buyers', e);
      return null;
    }
  },

  // 5. Predict Net Realization via Python ML Engine
  predictNetRealization: async (payload: {
    cropId: string;
    quantityQuintals: number;
    expectedLossPercent: number;
    qualityGrade: string;
    maxDistanceKm?: number;
  }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/predict/realization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to calculate realization');
      return await res.json();
    } catch (e) {
      console.warn('[KisanSetuApi] Fallback to local realization calculation', e);
      return null;
    }
  },

  // 6. Fetch 30-Day Price Forecast & AI Advisory
  getForecastAdvisory: async (cropId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/predict/forecast/${cropId}`);
      if (!res.ok) throw new Error('Failed to fetch forecast');
      return await res.json();
    } catch (e) {
      console.warn('[KisanSetuApi] Fallback to local forecast', e);
      return null;
    }
  },

  // 7. Orders API
  getOrders: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return await res.json();
    } catch (e) {
      console.warn('[KisanSetuApi] Fallback to local orders', e);
      return null;
    }
  },

  createDirectBuyerPo: async (payload: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/direct-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create direct PO');
      return await res.json();
    } catch (e) {
      console.warn('[KisanSetuApi] Fallback to local direct PO creation', e);
      return null;
    }
  },

  settleOrderEscrow: async (orderId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/settle`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to settle escrow');
      return await res.json();
    } catch (e) {
      console.warn('[KisanSetuApi] Fallback to local settlement', e);
      return null;
    }
  },

  // Real Orders from Database
  getMyRealOrders: (token: string) => protectedRequest('/orders/my-orders', token),
  getAllRealDeals: (token: string) => protectedRequest('/orders/real-deals', token),

  // Real Logistics Shipments
  getLogisticsShipments: (token: string) => protectedRequest('/logistics/shipments', token),
  getLogisticsAvailableDeals: (token: string) => protectedRequest('/logistics/available-deals', token),
  getBuyerShipments: (token: string) => protectedRequest('/logistics/buyer/shipments', token),
  getFarmerShipments: (token: string) => protectedRequest('/logistics/farmer/shipments', token),
  getShipment: (token: string, dealId: string) => protectedRequest(`/logistics/shipments/${dealId}`, token),
  acceptLogisticsShipment: (token: string, dealId: string, freightAmount: number) => protectedRequest(
    `/logistics/shipments/${dealId}/accept`, token,
    { method: 'POST', body: JSON.stringify({ freightAmount }) }
  ),
  approveLogisticsProvider: (
  token: string,
  dealId: string,
  shipmentId: string
) =>
  protectedRequest(
    `/logistics/shipments/${dealId}/approve-provider`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ shipmentId }),
    }
  ),
  rejectLogisticsProvider: (token: string, dealId: string) => protectedRequest(`/logistics/shipments/${dealId}/reject-provider`, token, { method: 'POST' }),
  assignVehicle: (token: string, dealId: string, payload: unknown) => protectedRequest(`/logistics/shipments/${dealId}/vehicle`, token, { method: 'POST', body: JSON.stringify(payload) }),
  updateShipmentLocation: (token: string, dealId: string, payload: unknown) => protectedRequest(`/logistics/shipments/${dealId}/location`, token, { method: 'POST', body: JSON.stringify(payload) }),
  dispatchLogisticsShipment: (token: string, dealId: string, payload: unknown) => protectedRequest(`/logistics/shipments/${dealId}/dispatch`, token, { method: 'POST', body: JSON.stringify(payload) }),
  markLogisticsInTransit: (token: string, dealId: string) => protectedRequest(`/logistics/shipments/${dealId}/transit`, token, { method: 'POST' }),
  markLogisticsDelivered: (token: string, dealId: string) => protectedRequest(`/logistics/shipments/${dealId}/deliver`, token, { method: 'POST' }),
  completeLogisticsShipment: (token: string, dealId: string) => protectedRequest(`/logistics/shipments/${dealId}/complete`, token, { method: 'POST' }),

  // Backend-authoritative internal sandbox escrow.
  getPayments: (token: string) => protectedRequest('/payments', token),
  securePayment: (token: string, dealId: string) => protectedRequest(`/payments/${dealId}/secure`, token, { method: 'POST' }),
  releasePayment: (token: string, dealId: string) => protectedRequest(`/payments/${dealId}/release`, token, { method: 'POST' }),

  // Transport Payment Flow
  requestFreightPayment: (token: string, dealId: string) => protectedRequest(`/logistics/shipments/${dealId}/request-freight-payment`, token, { method: 'POST' }),
  approveFreightPayment: (token: string, dealId: string) => protectedRequest(`/logistics/shipments/${dealId}/approve-freight-payment`, token, { method: 'POST' }),
  rejectFreightPayment: (token: string, dealId: string) => protectedRequest(`/logistics/shipments/${dealId}/reject-freight-payment`, token, { method: 'POST' }),

  // Communities
  createCommunity: (token: string, payload: unknown) => protectedRequest('/communities', token, { method: 'POST', body: JSON.stringify(payload) }),
  listCommunities: (token: string) => protectedRequest('/communities', token),
  getCommunity: (token: string, communityId: string) => protectedRequest(`/communities/${communityId}`, token),
  joinCommunity: (token: string, communityId: string) => protectedRequest(`/communities/${communityId}/join`, token, { method: 'POST' }),
  leaveCommunity: (token: string, communityId: string) => protectedRequest(`/communities/${communityId}/leave`, token, { method: 'POST' }),
  transferCommunityLeadership: (token: string, communityId: string, newLeaderId: string) => protectedRequest(`/communities/${communityId}/transfer-leadership?new_leader_id=${newLeaderId}`, token, { method: 'POST' })
};
