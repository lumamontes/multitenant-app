// Auto-generated tenants index
// This file is automatically updated when you add/remove tenants

export const availableTenants = [
  "tenant1",
  "tenant2",
  "tenantDev"
];

// Helper function to load all tenant configs
export const loadAllTenants = () => {
  const tenants: Record<string, any> = {};
  
  tenants['tenant1'] = require('./tenants/tenant1.json');
  tenants['tenant2'] = require('./tenants/tenant2.json');
  tenants['tenantDev'] = require('./tenants/tenantDev.json');
  
  return tenants;
};

// Helper function to load specific tenant
export const loadTenant = (tenantId: string) => {
  try {
    return require(`./tenants/${tenantId}.json`);
  } catch (error) {
    throw new Error(`Tenant ${tenantId} not found`);
  }
};
