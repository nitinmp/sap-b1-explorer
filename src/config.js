export const PROXY_BASE = 'http://localhost:3001';

export const DEFAULT_CREDENTIALS = {
  companyDb: import.meta.env.VITE_SAP_COMPANY_DB || 'SBODEMOGB',
  user: import.meta.env.VITE_SAP_USER || 'manager',
};
