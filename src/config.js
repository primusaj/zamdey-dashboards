export const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';
export const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://zamdey-backend.onrender.com';

export const DEFAULT_ZONES = [
  { id: 'zone-douala-1', name: 'Douala - Akwa / Bonanjo', base_price: 1000, is_active: true, status: 'Active', risk: 'Low' },
  { id: 'zone-douala-2', name: 'Douala - Bonamoussadi / Makepe', base_price: 1200, is_active: true, status: 'Active', risk: 'Low' },
  { id: 'zone-douala-3', name: 'Douala - Bonaberi', base_price: 1500, is_active: true, status: 'Active', risk: 'Low' },
  { id: 'zone-yaounde-1', name: 'Yaoundé - Bastos / Centre', base_price: 1000, is_active: true, status: 'Active', risk: 'Low' },
  { id: 'zone-yaounde-2', name: 'Yaoundé - Omnisports / Essos', base_price: 1200, is_active: true, status: 'Active', risk: 'Low' },
  { id: 'zone-buea-1', name: 'Buea - Molyko / Clerks Quarter', base_price: 800, is_active: true, status: 'Active', risk: 'Low' },
  { id: 'zone-bamenda-1', name: 'Bamenda - Commercial Avenue', base_price: 1000, is_active: true, status: 'Active', risk: 'Low' },
];

export async function fetchSafeZones() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/zones`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Graceful fallback without throwing or logging console error
  }
  return DEFAULT_ZONES;
}
