import axios from 'axios';
import {
  Driver, Vehicle, User, Vendor, Trip, Booking, Contract,
  FuelLog, MaintenanceLog, ComplianceDoc,
  AppNotification, AuditLog, SystemSetting,
  ContractService, ContractDocument, ContractNote, ContractPayment,
  ContractActivityLog, ContractDraft, DriverDraft
} from '../types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function detectCircular(obj: any, path = 'root') {
  const seen = new WeakSet();

  function walk(value: any, currentPath: string) {
    if (value === null || typeof value !== 'object') return;

    if (seen.has(value)) {
      throw new Error(`Circular reference detected at ${currentPath}`);
    }

    seen.add(value);

    for (const key of Object.keys(value)) {
      walk(value[key], `${currentPath}.${key}`);
    }
  }

  walk(obj, path);
}

apiClient.interceptors.request.use((config) => {
  const isSuperAdminRoute = config.url?.includes('/super-admin');
  const token = isSuperAdminRoute ? localStorage.getItem('super_admin_auth') : localStorage.getItem('cms_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data && !(config.data instanceof FormData)) {
    try {
      detectCircular(config.data, `RequestData(${config.url})`);
    } catch (e) {
      console.error("[API Interceptor] CIRCULAR JSON DETECTED BEFORE REQUEST!", e);
      throw e;
    }
  }

  return config;
});

export const api = {
  // ─── File Upload ───
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ url: string; filename: string }>('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  // ─── Auth ───
  login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }).then(res => res.data),
  getCurrentUser: () => apiClient.get<User>('/auth/me').then(res => res.data),

  // ─── Users ───
  getUsers: () => apiClient.get<User[]>('/users/').then(res => res.data),
  getUser: (id: number | string) => apiClient.get<User>(`/users/${id}`).then(res => res.data),
  createUser: (user: Partial<User> & { password?: string }) => apiClient.post<User>('/users/', user).then(res => res.data),
  updateUser: (id: number | string, user: Partial<User>) => apiClient.put<User>(`/users/${id}`, user).then(res => res.data),
  deleteUser: (id: number | string) => apiClient.delete(`/users/${id}`).then(res => res.data),
  updateUserStatus: (id: number | string, status: string) => apiClient.patch(`/users/${id}/status?status=${status}`).then(res => res.data),
  resetUserPassword: (id: number | string) => apiClient.post<{message: string, new_password: string}>(`/users/${id}/reset-password`).then(res => res.data),

  // ─── Drivers ───
  getDrivers: () => apiClient.get<Driver[]>('/drivers/').then(res => res.data),
  getDriver: (id: number | string) => apiClient.get<Driver>(`/drivers/${id}`).then(res => res.data),
  createDriver: (driver: Partial<Driver>) => apiClient.post<Driver>('/drivers/', driver).then(res => res.data),
  updateDriver: (id: number | string, driver: Partial<Driver>) => apiClient.put<Driver>(`/drivers/${id}`, driver).then(res => res.data),
  deleteDriver: (id: number | string) => apiClient.delete(`/drivers/${id}`).then(res => res.data),
  
  // ─── Driver Drafts ───
  getDriverDrafts: () => apiClient.get<DriverDraft[]>('/driver-drafts/').then(res => res.data),
  getDriverDraft: (id: number | string) => apiClient.get<DriverDraft>(`/driver-drafts/${id}`).then(res => res.data),
  createDriverDraft: (draft: Partial<DriverDraft>) => apiClient.post<DriverDraft>('/driver-drafts/', draft).then(res => res.data),
  updateDriverDraft: (id: number | string, draft: Partial<DriverDraft>) => apiClient.put<DriverDraft>(`/driver-drafts/${id}`, draft).then(res => res.data),
  deleteDriverDraft: (id: number | string) => apiClient.delete(`/driver-drafts/${id}`).then(res => res.data),
  submitDriverDraft: (id: number | string) => apiClient.post<Driver>(`/driver-drafts/${id}/convert`).then(res => res.data),

  // ─── Vehicles ───
  getVehicles: () => apiClient.get<Vehicle[]>('/vehicles/').then(res => res.data),
  getVehicle: (id: number | string) => apiClient.get<Vehicle>(`/vehicles/${id}`).then(res => res.data),
  createVehicle: (vehicle: Partial<Vehicle>) => apiClient.post<Vehicle>('/vehicles/', vehicle).then(res => res.data),
  updateVehicle: (id: number | string, vehicle: Partial<Vehicle>) => apiClient.put<Vehicle>(`/vehicles/${id}`, vehicle).then(res => res.data),
  deleteVehicle: (id: number | string) => apiClient.delete(`/vehicles/${id}`).then(res => res.data),

  // ─── Bookings ───
  getBookings: () => apiClient.get<Booking[]>('/bookings/').then(res => res.data),
  getBooking: (id: number | string) => apiClient.get<Booking>(`/bookings/${id}`).then(res => res.data),
  createBooking: (booking: Partial<Booking>) => apiClient.post<Booking>('/bookings/', booking).then(res => res.data),
  updateBooking: (id: number | string, booking: Partial<Booking>) => apiClient.put<Booking>(`/bookings/${id}`, booking).then(res => res.data),
  deleteBooking: (id: number | string) => apiClient.delete(`/bookings/${id}`).then(res => res.data),

  // ─── Trips ───
  getTrips: () => apiClient.get<Trip[]>('/routes/').then(res => res.data),
  getTrip: (id: number | string) => apiClient.get<Trip>(`/routes/${id}`).then(res => res.data),
  createTrip: (trip: Partial<Trip>) => apiClient.post<Trip>('/routes/', trip).then(res => res.data),
  updateTrip: (id: number | string, trip: Partial<Trip>) => apiClient.put<Trip>(`/routes/${id}`, trip).then(res => res.data),
  deleteTrip: (id: number | string) => apiClient.delete(`/routes/${id}`).then(res => res.data),

  // ─── Contracts ───
  getContracts: (params?: any) => apiClient.get<Contract[]>('/contracts/', { params }).then(res => res.data),
  getContract: (id: number | string) => apiClient.get<Contract>(`/contracts/${id}`).then(res => res.data),
  createContract: (contract: Partial<Contract>) => apiClient.post<Contract>('/contracts/', contract).then(res => res.data),
  updateContract: (id: number | string, contract: Partial<Contract>) => apiClient.put<Contract>(`/contracts/${id}`, contract).then(res => res.data),
  deleteContract: (id: number | string) => apiClient.delete(`/contracts/${id}`).then(res => res.data),
  getContractDrafts: () => apiClient.get<ContractDraft[]>('/contracts/drafts/all').then(res => res.data),
  getContractDraft: (id: number | string) => apiClient.get<ContractDraft>(`/contracts/drafts/${id}`).then(res => res.data),
  createContractDraft: (draft: Partial<ContractDraft>) => apiClient.post<ContractDraft>('/contracts/drafts', draft).then(res => res.data),
  updateContractDraft: (id: number | string, draft: Partial<ContractDraft>) => apiClient.put<ContractDraft>(`/contracts/drafts/${id}`, draft).then(res => res.data),
  deleteContractDraft: (id: number | string) => apiClient.delete(`/contracts/drafts/${id}`).then(res => res.data),

  // ─── Vendors ───
  getVendors: () => apiClient.get<Vendor[]>('/vendors/').then(res => res.data),
  getVendor: (id: number | string) => apiClient.get<Vendor>(`/vendors/${id}`).then(res => res.data),
  createVendor: (vendor: Partial<Vendor>) => apiClient.post<Vendor>('/vendors/', vendor).then(res => res.data),
  updateVendor: (id: number | string, vendor: Partial<Vendor>) => apiClient.put<Vendor>(`/vendors/${id}`, vendor).then(res => res.data),
  deleteVendor: (id: number | string) => apiClient.delete(`/vendors/${id}`).then(res => res.data),


  // ─── Fuel Logs ───
  getFuelLogs: () => apiClient.get<FuelLog[]>('/fuel-logs/').then(res => res.data),
  getFuelLog: (id: number | string) => apiClient.get<FuelLog>(`/fuel-logs/${id}`).then(res => res.data),
  createFuelLog: (log: Partial<FuelLog>) => apiClient.post<FuelLog>('/fuel-logs/', log).then(res => res.data),
  updateFuelLog: (id: number | string, log: Partial<FuelLog>) => apiClient.put<FuelLog>(`/fuel-logs/${id}`, log).then(res => res.data),
  deleteFuelLog: (id: number | string) => apiClient.delete(`/fuel-logs/${id}`).then(res => res.data),

  // ─── Maintenance Logs ───
  getMaintenanceLogs: () => apiClient.get<MaintenanceLog[]>('/maintenance-logs/').then(res => res.data),
  getMaintenanceLog: (id: number | string) => apiClient.get<MaintenanceLog>(`/maintenance-logs/${id}`).then(res => res.data),
  createMaintenanceLog: (log: Partial<MaintenanceLog>) => apiClient.post<MaintenanceLog>('/maintenance-logs/', log).then(res => res.data),
  updateMaintenanceLog: (id: number | string, log: Partial<MaintenanceLog>) => apiClient.put<MaintenanceLog>(`/maintenance-logs/${id}`, log).then(res => res.data),
  deleteMaintenanceLog: (id: number | string) => apiClient.delete(`/maintenance-logs/${id}`).then(res => res.data),

  // ─── Compliance Docs ───
  getComplianceDocs: () => apiClient.get<ComplianceDoc[]>('/compliance-docs/').then(res => res.data),
  getComplianceDoc: (id: number | string) => apiClient.get<ComplianceDoc>(`/compliance-docs/${id}`).then(res => res.data),
  createComplianceDoc: (doc: Partial<ComplianceDoc>) => apiClient.post<ComplianceDoc>('/compliance-docs/', doc).then(res => res.data),
  updateComplianceDoc: (id: number | string, doc: Partial<ComplianceDoc>) => apiClient.put<ComplianceDoc>(`/compliance-docs/${id}`, doc).then(res => res.data),
  deleteComplianceDoc: (id: number | string) => apiClient.delete(`/compliance-docs/${id}`).then(res => res.data),
  approveComplianceDoc: (id: number | string) => apiClient.post<ComplianceDoc>(`/compliance-docs/${id}/approve`).then(res => res.data),
  rejectComplianceDoc: (id: number | string, reason: string) => apiClient.post<ComplianceDoc>(`/compliance-docs/${id}/reject`, { reason }).then(res => res.data),


  // ─── Notifications ───
  getNotifications: () => apiClient.get<AppNotification[]>('/notifications/').then(res => res.data),
  getNotification: (id: number) => apiClient.get<AppNotification>(`/notifications/${id}`).then(res => res.data),
  createNotification: (notif: Partial<AppNotification>) => apiClient.post<AppNotification>('/notifications/', notif).then(res => res.data),
  updateNotification: (id: number, notif: Partial<AppNotification>) => apiClient.put<AppNotification>(`/notifications/${id}`, notif).then(res => res.data),
  deleteNotification: (id: number) => apiClient.delete(`/notifications/${id}`).then(res => res.data),

  // ─── System Settings ───
  getSettings: () => apiClient.get<SystemSetting[]>('/settings/').then(res => res.data),
  getSetting: (id: number) => apiClient.get<SystemSetting>(`/settings/${id}`).then(res => res.data),
  createSetting: (setting: Partial<SystemSetting>) => apiClient.post<SystemSetting>('/settings/', setting).then(res => res.data),
  updateSetting: (id: number, setting: Partial<SystemSetting>) => apiClient.put<SystemSetting>(`/settings/${id}`, setting).then(res => res.data),
  deleteSetting: (id: number) => apiClient.delete(`/settings/${id}`).then(res => res.data),

  // ─── Audit Logs (read-only + create) ───
  getAuditLogs: () => apiClient.get<AuditLog[]>('/audit-logs/').then(res => res.data),
  getAuditLog: (id: number) => apiClient.get<AuditLog>(`/audit-logs/${id}`).then(res => res.data),
  createAuditLog: (log: Partial<AuditLog>) => apiClient.post<AuditLog>('/audit-logs/', log).then(res => res.data),

  // ─── Contract Services ───
  getContractServices: () => apiClient.get<ContractService[]>('/contract-services/').then(res => res.data),
  createContractService: (svc: Partial<ContractService>) => apiClient.post<ContractService>('/contract-services/', svc).then(res => res.data),
  updateContractService: (id: number, svc: Partial<ContractService>) => apiClient.put<ContractService>(`/contract-services/${id}`, svc).then(res => res.data),
  deleteContractService: (id: number) => apiClient.delete(`/contract-services/${id}`).then(res => res.data),

  // ─── Contract Documents ───
  getContractDocuments: () => apiClient.get<ContractDocument[]>('/contract-documents/').then(res => res.data),
  createContractDocument: (doc: Partial<ContractDocument>) => apiClient.post<ContractDocument>('/contract-documents/', doc).then(res => res.data),
  updateContractDocument: (id: number, doc: Partial<ContractDocument>) => apiClient.put<ContractDocument>(`/contract-documents/${id}`, doc).then(res => res.data),
  deleteContractDocument: (id: number) => apiClient.delete(`/contract-documents/${id}`).then(res => res.data),

  // ─── Contract Notes ───
  getContractNotes: () => apiClient.get<ContractNote[]>('/contract-notes/').then(res => res.data),
  createContractNote: (note: Partial<ContractNote>) => apiClient.post<ContractNote>('/contract-notes/', note).then(res => res.data),
  updateContractNote: (id: number, note: Partial<ContractNote>) => apiClient.put<ContractNote>(`/contract-notes/${id}`, note).then(res => res.data),
  deleteContractNote: (id: number) => apiClient.delete(`/contract-notes/${id}`).then(res => res.data),

  // ─── Contract Payments ───
  getContractPayments: () => apiClient.get<ContractPayment[]>('/contract-payments/').then(res => res.data),
  createContractPayment: (payment: Partial<ContractPayment>) => apiClient.post<ContractPayment>('/contract-payments/', payment).then(res => res.data),
  updateContractPayment: (id: number, payment: Partial<ContractPayment>) => apiClient.put<ContractPayment>(`/contract-payments/${id}`, payment).then(res => res.data),
  deleteContractPayment: (id: number) => apiClient.delete(`/contract-payments/${id}`).then(res => res.data),

  // ─── Contract Activity Logs (read-only + create) ───
  getContractActivityLogs: () => apiClient.get<ContractActivityLog[]>('/contract-activity/').then(res => res.data),
  createContractActivityLog: (log: Partial<ContractActivityLog>) => apiClient.post<ContractActivityLog>('/contract-activity/', log).then(res => res.data),



  // ─── Corporate Contract Documents ───
  getCorporateContractDocuments: (contractId: number) => apiClient.get<any[]>(`/api/corporate-contracts/${contractId}/documents`).then(res => res.data),
  createCorporateContractDocument: (contractId: number, doc: any) => apiClient.post<any>(`/api/corporate-contracts/${contractId}/documents`, doc).then(res => res.data),
  updateCorporateContractDocument: (docId: number, doc: any) => apiClient.put<any>(`/api/corporate-contracts/documents/${docId}`, doc).then(res => res.data),
  deleteCorporateContractDocument: (docId: number) => apiClient.delete(`/api/corporate-contracts/documents/${docId}`).then(res => res.data),

  // ─── Corporate Contract Approvals ───
  getCorporateContractApprovals: (contractId: number) => apiClient.get<any[]>(`/api/corporate-contracts/${contractId}/approvals`).then(res => res.data),
  createCorporateContractApproval: (contractId: number, approval: any) => apiClient.post<any>(`/api/corporate-contracts/${contractId}/approvals`, approval).then(res => res.data),
  updateCorporateContractApproval: (approvalId: number, approval: any) => apiClient.put<any>(`/api/corporate-contracts/approvals/${approvalId}`, approval).then(res => res.data),
  deleteCorporateContractApproval: (approvalId: number) => apiClient.delete(`/api/corporate-contracts/approvals/${approvalId}`).then(res => res.data),

  // ─── Corporate Contract Renewals ───
  getCorporateContractRenewals: (contractId: number) => apiClient.get<any[]>(`/api/corporate-contracts/${contractId}/renewals`).then(res => res.data),
  createCorporateContractRenewal: (contractId: number, renewal: any) => apiClient.post<any>(`/api/corporate-contracts/${contractId}/renewals`, renewal).then(res => res.data),
  updateCorporateContractRenewal: (renewalId: number, renewal: any) => apiClient.put<any>(`/api/corporate-contracts/renewals/${renewalId}`, renewal).then(res => res.data),
  deleteCorporateContractRenewal: (renewalId: number) => apiClient.delete(`/api/corporate-contracts/renewals/${renewalId}`).then(res => res.data),

  // ─── Corporate Contract History ───
  getCorporateContractHistory: (contractId: number) => apiClient.get<any[]>(`/api/corporate-contracts/${contractId}/history`).then(res => res.data),
  createCorporateContractHistory: (contractId: number, history: any) => apiClient.post<any>(`/api/corporate-contracts/${contractId}/history`, history).then(res => res.data),

  // ─── Corporate Contract Export ───
  exportCorporateContracts: () => apiClient.get<any[]>('/api/corporate-contracts/export/csv').then(res => res.data),
  getSuperAdminStats: () => apiClient.get<any>('/super-admin/dashboard-stats').then(res => res.data),
  getSuperAdminAuditLogs: () => apiClient.get<any[]>('/super-admin/audit-logs').then(res => res.data),
  getSuperAdminCompanies: () => apiClient.get<any[]>('/super-admin/companies').then(res => res.data),
  
  // Users
  getSuperAdminUsers: () => apiClient.get<any[]>('/super-admin/users').then(res => res.data),
  createSuperAdminUser: (user: Partial<any>) => apiClient.post<any>('/super-admin/users', user).then(res => res.data),
  updateSuperAdminUser: (id: number, user: any) => apiClient.put<any>(`/super-admin/users/${id}`, user).then(res => res.data),
  updateSuperAdminUserStatus: (id: number, status: string) => apiClient.put<any>(`/super-admin/users/${id}/status`, { status }).then(res => res.data),
  deleteSuperAdminUser: (id: number) => apiClient.delete(`/super-admin/users/${id}`).then(res => res.data),

  // Roles
  getSuperAdminRoles: (companyId?: number) => apiClient.get<any[]>(companyId ? `/super-admin/roles?company_id=${companyId}` : '/super-admin/roles').then(res => res.data),
  createSuperAdminRole: (role: Partial<any>) => apiClient.post<any>('/super-admin/roles', role).then(res => res.data),
  updateSuperAdminRole: (id: number, role: any) => apiClient.put<any>(`/super-admin/roles/${id}`, role).then(res => res.data),
  deleteSuperAdminRole: (id: number) => apiClient.delete(`/super-admin/roles/${id}`).then(res => res.data),
  getSuperAdminRolePermissions: (id: number) => apiClient.get<any[]>(`/super-admin/roles/${id}/permissions`).then(res => res.data),
  updateSuperAdminRolePermissions: (id: number, permissions: any[]) => apiClient.put<any>(`/super-admin/roles/${id}/permissions`, permissions).then(res => res.data),
  getMatrixPermissions: (companyId: number, roleName: string) => apiClient.get<any[]>(`/super-admin/matrix-permissions?company_id=${companyId}&role_name=${roleName}`).then(res => res.data),
  updateMatrixPermissions: (companyId: number, roleName: string, permissions: any[]) => apiClient.put<any>(`/super-admin/matrix-permissions?company_id=${companyId}&role_name=${roleName}`, permissions).then(res => res.data),

  // ─── Dashboard ───
  getDashboardStats: () => apiClient.get<any>('/dashboard/stats').then(res => res.data),

  // ─── Tasks ───
  getTasks: () => apiClient.get<any[]>('/super-admin/tasks').then(res => res.data),
  createTask: (task: Partial<any>) => apiClient.post<any>('/super-admin/tasks', task).then(res => res.data),
  updateTask: (id: number, task: any) => apiClient.put<any>(`/super-admin/tasks/${id}`, task).then(res => res.data),
  updateTaskStatus: (id: number, status: string) => apiClient.put<any>(`/super-admin/tasks/${id}/status`, { status }).then(res => res.data),
  deleteTask: (id: number) => apiClient.delete(`/super-admin/tasks/${id}`).then(res => res.data),

  // ─── Tenders ───
  getTenders: () => apiClient.get<any[]>('/super-admin/tenders').then(res => res.data),
  createTender: (tender: Partial<any>) => apiClient.post<any>('/super-admin/tenders', tender).then(res => res.data),
  updateTender: (id: number, tender: any) => apiClient.put<any>(`/super-admin/tenders/${id}`, tender).then(res => res.data),
  updateTenderStatus: (id: number, status: string) => apiClient.put<any>(`/super-admin/tenders/${id}/status`, { status }).then(res => res.data),
  deleteTender: (id: number) => apiClient.delete(`/super-admin/tenders/${id}`).then(res => res.data),

  // Announcements
  getAnnouncements: () => apiClient.get<any[]>('/super-admin/announcements').then(res => res.data),
  createAnnouncement: (announcement: Partial<any>) => apiClient.post<any>('/super-admin/announcements', announcement).then(res => res.data),
  publishAnnouncement: (id: number) => apiClient.post<any>(`/super-admin/announcements/${id}/publish`).then(res => res.data),
  deleteAnnouncement: (id: number) => apiClient.delete(`/super-admin/announcements/${id}`).then(res => res.data),
  
  getCompanyNotifications: () => apiClient.get<any[]>('/company/notifications').then(res => res.data),
  readCompanyNotification: (id: number) => apiClient.patch<any>(`/company/notifications/${id}/read`).then(res => res.data),
  getCompanyAnnouncements: () => apiClient.get<any[]>('/company/announcements').then(res => res.data),

  // ─── Export ───
  exportToPdf: async (payload: { title: string; headers: string[]; rows: any[][] }) => {
    const res = await apiClient.post('/export/pdf', payload, { responseType: 'blob' });
    return res.data;
  },
  exportToExcel: async (payload: { title: string; headers: string[]; rows: any[][] }) => {
    const res = await apiClient.post('/export/excel', payload, { responseType: 'blob' });
    return res.data;
  },

  // Corporate Contracts
  getRateCardsByState: async (state: string) => {
    const res = await apiClient.get(`/rate-cards/${state}`);
    return res.data;
  },
  getCorporateContracts: async () => {
    const res = await apiClient.get('/corporate-contracts/');
    return res.data;
  },
  createCorporateContract: async (contractData: any) => {
    const res = await apiClient.post('/corporate-contracts/', contractData);
    return res.data;
  },
  getCorporateContract: async (id: number | string) => {
    const res = await apiClient.get(`/corporate-contracts/${id}`);
    return res.data;
  },
  updateCorporateContract: async (id: number | string, contractData: any) => {
    const res = await apiClient.put(`/corporate-contracts/${id}`, contractData);
    return res.data;
  },
  deleteCorporateContract: async (id: number | string) => {
    const res = await apiClient.delete(`/corporate-contracts/${id}`);
    return res.data;
  }
};

export default apiClient;
