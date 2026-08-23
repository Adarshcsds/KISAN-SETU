/**
 * KisanSetu FastAPI Backend Integration Client
 * Base URL: http://127.0.0.1:8000/api
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface BackendHealthResponse {
  status: string;
  service: string;
  ml_engine: string;
  data_store: string;
}

export const KisanSetuApi = {
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
  }
};
