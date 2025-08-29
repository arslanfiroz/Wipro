export const env = {
  production: false,
  inventoryApi: (globalThis as any)['API_INVENTORY'] || 'http://localhost:5001',
  salesApi: (globalThis as any)['API_SALES'] || 'http://localhost:5002',
  authApi: (globalThis as any)['API_AUTH'] || 'http://localhost:5003'
};
