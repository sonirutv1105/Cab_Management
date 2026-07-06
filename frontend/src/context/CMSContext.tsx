/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api } from '../api/client';
import {
  User,
  UserRole,
  ModuleType,
  Driver,
  Vehicle,
  Trip,
  Vendor,
  Booking,
  FuelLog,
  MaintenanceLog,
  ComplianceDoc,
  AppNotification,
  AuditLog,
  SystemSetting,
  DriverDraft
} from '../types';
// Removed mock data imports

interface CMSContextType {
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  hasPermission: (module: string, action: string) => boolean;

  // Data layers
  drivers: Driver[];
  driverDrafts: DriverDraft[];
  vehicles: Vehicle[];
  trips: Trip[];
  vendors: Vendor[];
  bookings: Booking[];
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  complianceDocs: ComplianceDoc[];
  notifications: AppNotification[];
  activePopupNotifications: AppNotification[];
  auditLogs: AuditLog[];
  settings: SystemSetting[];

  // Mutators & Operations

  addDriver: (driver: Omit<Driver, 'id'>) => Promise<void>;
  updateDriver: (driver: Driver) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  addDriverDraft: (driver: Partial<DriverDraft>) => Promise<string>;
  updateDriverDraft: (id: string, driver: Partial<DriverDraft>) => Promise<void>;
  deleteDriverDraft: (id: string) => Promise<void>;
  submitDriverDraft: (id: string) => Promise<void>;

  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id: string) => void;

  addTrip: (trip: Omit<Trip, 'id'>) => void;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (id: string) => void;

  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (id: string) => void;

  addBooking: (booking: Omit<Booking, 'id'>) => void;
  updateBooking: (booking: Booking) => void;
  approveBooking: (id: string, stage: 'manager' | 'hr', decision: 'Approved' | 'Rejected') => void;
  allocateBookingToTrip: (bookingId: string, tripId: string) => void;
  deleteBooking: (id: string) => void;

  addFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  updateMaintenanceLog: (log: MaintenanceLog) => void;

  addComplianceDoc: (doc: Omit<ComplianceDoc, 'id'>) => void;
  updateComplianceDoc: (doc: ComplianceDoc) => void;
  deleteComplianceDoc: (id: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  clearAllNotifications: () => void;
  addNotification: (notif: { title: string; message: string; targetRole?: string }) => void;
  systemSettings: {
    systemName: string;
    gracePeriodMinutes: number;
    panicSirensEnabled: boolean;
  };
  updateSystemSettings: (newSettings: {
    systemName: string;
    gracePeriodMinutes: number;
    panicSirensEnabled: boolean;
  }) => void;

  updateSetting: (key: string, value: string) => void;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>('Dashboard');

  // Load States
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverDrafts, setDriverDrafts] = useState<DriverDraft[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDoc[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [systemSettings, setSystemSettings] = useState({
    systemName: 'CMS Enterprise',
    gracePeriodMinutes: 15,
    panicSirensEnabled: true
  });

  // Validate session on mount
  useEffect(() => {
    const isDemoMode = true; // FORCE BYPASS FOR DEMO DEPLOYMENT
    if (isDemoMode) {
      localStorage.setItem('cms_token', 'demo-token');
      localStorage.setItem('userRole', 'COMPANY_HEAD');
      
      const defaultPermissions = [
        "dashboard", "driver_management", "vehicle_management", "trip_management",
        "vendor_management", "booking_management", "live_tracking", "fuel_management",
        "maintenance_management", "compliance_management", "contract_management",
        "reports_analytics", "notifications", "audit_logs", "user_roles",
        "support_tickets", "company_settings"
      ].flatMap(module => [
        { module, action: "view" },
        { module, action: "create" },
        { module, action: "update" },
        { module, action: "delete" }
      ]);

      api.getCurrentUser()
        .then(user => {
          setCurrentUserState({
            ...user,
            permissions: user.permissions && user.permissions.length > 0 ? user.permissions : defaultPermissions
          });
          setIsAuthenticated(true);
        })
        .catch(err => {
          console.error('Session validation failed in Demo Mode, using static fallback', err);
          setCurrentUserState({
            id: 1,
            name: 'Demo Admin',
            email: 'demo@example.com',
            role: 'COMPANY_HEAD',
            companyName: 'Demo Company',
            lastActive: new Date().toISOString(),
            permissions: defaultPermissions
          });
          setIsAuthenticated(true);
        })
        .finally(() => {
          setIsInitializing(false);
        });
      return;
    }

    const token = localStorage.getItem('cms_token');
    if (token) {
      api.getCurrentUser()
        .then(user => {
          setCurrentUserState(user);
          setIsAuthenticated(true);
        })
        .catch(err => {
          console.error('Session validation failed', err);
          localStorage.removeItem('cms_token');
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  // Fetch ALL dynamic data on authentication (connects every module to backend)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Core modules
    api.getDrivers().then(setDrivers).catch(err => console.log('Failed to fetch drivers', err));
    api.getDriverDrafts().then(setDriverDrafts).catch(err => console.log('Failed to fetch driver drafts', err));
    api.getVehicles().then(setVehicles).catch(err => console.log('Failed to fetch vehicles', err));
    api.getVendors().then(setVendors).catch(err => console.log('Failed to fetch vendors', err));
    api.getTrips().then(setTrips).catch(err => console.log('Failed to fetch trips', err));
    api.getBookings().then(setBookings).catch(err => console.log('Failed to fetch bookings', err));
    api.getContracts().then(() => {}).catch(err => console.log('Failed to fetch contracts', err));

    // Extended modules - previously missing!
    api.getFuelLogs().then(setFuelLogs).catch(err => console.log('Failed to fetch fuel logs', err));
    api.getMaintenanceLogs().then(setMaintenanceLogs).catch(err => console.log('Failed to fetch maintenance logs', err));
    api.getComplianceDocs().then(setComplianceDocs).catch(err => console.log('Failed to fetch compliance docs', err));
    
    const role = localStorage.getItem('userRole') || 'SUPER_ADMIN';
    if (role === 'COMPANY_HEAD' || role === 'COMPANY_HR') {
      api.getCompanyNotifications().then(data => {
         const mapped = data.map((n: any) => ({
           id: n.id,
           title: n.announcement?.title || 'Announcement',
           message: n.announcement?.message || '',
           category: 'System',
           severity: n.announcement?.priority === 'Critical' ? 'Critical' : n.announcement?.priority === 'Important' ? 'Warning' : 'Info',
           timestamp: n.created_at?.replace('T', ' ').substring(0, 19) || '',
           read: n.is_read
         }));
         setNotifications(mapped);
      }).catch(err => console.log('Failed to fetch company notifications', err));
    } else {
      api.getNotifications().then(setNotifications).catch(err => console.log('Failed to fetch notifications', err));
    }
    
    api.getAuditLogs().then(setAuditLogs).catch(err => console.log('Failed to fetch audit logs', err));
    api.getSettings().then(setSettings).catch(err => console.log('Failed to fetch settings', err));
    
    // Polling for real-time updates of external bookings
    const intervalId = setInterval(() => {
      api.getBookings().then(setBookings).catch(err => console.log('Failed to fetch bookings', err));
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // Helper to log changes to the audit trail
  const appendAuditLog = (action: string, module: ModuleType, details: string, status: 'Success' | 'Failed' = 'Success') => {
    const logData = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: String(currentUser?.id || ''),
      userEmail: currentUser?.email || 'Unknown',
      userRole: currentUser?.role || 'Unknown',
      action,
      module,
      details,
      ipAddress: '192.168.10.' + Math.floor(Math.random() * 150 + 10),
      status
    };
    // Save audit log to backend
    api.createAuditLog(logData as any).then(savedLog => {
      setAuditLogs((prev) => [savedLog, ...prev]);
    }).catch(() => {
      // Fallback: still keep it in local state if API fails
      const fallbackLog: AuditLog = { ...logData, id: Date.now(), userId: currentUser?.id || 0 } as AuditLog;
      setAuditLogs((prev) => [fallbackLog, ...prev]);
    });
  };

  // Helper to trigger system alerts
  const createNotification = (title: string, message: string, category: AppNotification['category'], severity: AppNotification['severity']) => {
    const newAlert: AppNotification = {
      id: Date.now(),
      title,
      message,
      category,
      severity,
      timestamp: 'Just now',
      read: false
    };
    // Save notification to backend
    api.createNotification(newAlert).then(savedNotif => {
      setNotifications((prev) => [savedNotif, ...prev]);
    }).catch(() => {
      setNotifications((prev) => [newAlert, ...prev]);
    });
  };

  // Switch role helper
  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    appendAuditLog('Switch Active Role Context', 'User Management', `Session switched to user profile ${user.name} (${user.role.toUpperCase()})`);
  };

  const hasPermission = (module: string, action: string) => {
    return true; // FORCE BYPASS FOR DEMO DEPLOYMENT
    if (currentUser?.role === 'super_admin') return true;
    if (!currentUser?.permissions) return false;
    
    // Check if permission exists in the array
    return currentUser.permissions.some(
      (p) => p.module === module && p.action === action
    );
  };

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.login(email, pass);
      if (response && response.access_token) {
        localStorage.setItem('cms_token', response.access_token);
        setCurrentUserState(response.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cms_token');
    if (currentUser) {
      appendAuditLog('User Logout', 'User Management', `User logged out: ${currentUser.name}`);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 2. Driver Operations - CONNECTED TO API
  // ═══════════════════════════════════════════════════════════
  const addDriver = async (drvData: Omit<Driver, 'id'>) => {
    const newDrv = { ...drvData };
    try {
      const savedDriver = await api.createDriver(newDrv);
      setDrivers((prev) => [...prev, savedDriver]);
      appendAuditLog('Register Fleet Driver', 'Driver Management', `Registered driver ${savedDriver.name} (License: ${savedDriver.licenseNumber})`);
    } catch (err) {
      console.error("API Error", err);
      throw err;
    }
  };
  
  const updateDriver = async (drv: Driver) => {
    try {
      const updatedDriver = await api.updateDriver(drv.id, drv);
      setDrivers((prev) => prev.map((d) => (d.id === drv.id ? updatedDriver : d)));
      appendAuditLog('Update Driver Profile', 'Driver Management', `Modified driver telemetry and records for ${updatedDriver.name}`);
    } catch (err) {
      console.error("API Error updating driver", err);
      throw err;
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      await api.deleteDriver(id);
      const drv = drivers.find((d) => d.id === id);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      if (drv) {
        appendAuditLog('Deregister Fleet Driver', 'Driver Management', `Deregistered driver profile for ${drv.name} (ID: ${id})`);
      }
    } catch (err) {
      console.error("API Error deleting driver", err);
      throw err;
    }
  };

  const addDriverDraft = async (drvData: Partial<DriverDraft>) => {
    const id = Date.now();
    const newDrv = { ...drvData, draft_id: id };
    try {
      const savedDraft = await api.createDriverDraft(newDrv);
      setDriverDrafts((prev) => [...prev, savedDraft]);
      return savedDraft.draft_id;
    } catch (err) {
      console.error("API Error adding draft", err);
      throw err;
    }
  };

  const updateDriverDraft = async (id: string, drv: Partial<DriverDraft>) => {
    try {
      const updatedDraft = await api.updateDriverDraft(id, drv);
      setDriverDrafts((prev) => prev.map((d) => (d.draft_id === id ? updatedDraft : d)));
    } catch (err) {
      console.error("API Error updating draft", err);
      throw err;
    }
  };

  const deleteDriverDraft = async (id: string) => {
    try {
      await api.deleteDriverDraft(id);
      setDriverDrafts((prev) => prev.filter((d) => d.draft_id !== id));
    } catch (err) {
      console.error("API Error deleting draft", err);
      throw err;
    }
  };

  const submitDriverDraft = async (id: string) => {
    try {
      const submittedDriver = await api.submitDriverDraft(id);
      setDriverDrafts((prev) => prev.filter((d) => d.draft_id !== id));
      setDrivers((prev) => [...prev, submittedDriver]);
      appendAuditLog('Submit Fleet Driver', 'Driver Management', `Submitted driver draft ${submittedDriver.name}`);
    } catch (err) {
      console.error("API Error submitting draft", err);
      throw err;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 3. Vehicle Operations - CONNECTED TO API
  // ═══════════════════════════════════════════════════════════
  const addVehicle = (vData: Omit<Vehicle, 'id'>) => {
    const newVh = { ...vData };
    return api.createVehicle(newVh).then(savedVehicle => {
      setVehicles((prev) => [...prev, savedVehicle]);
      appendAuditLog('Add Fleet Vehicle', 'Vehicle Management', `Registered brand new vehicle ${savedVehicle.make} ${savedVehicle.model} (${savedVehicle.plateNumber})`);
      if (savedVehicle.fuelType === 'Electric') {
        createNotification('Green fleet initiative incremented', `Electric vehicle logged: Base model ${savedVehicle.model} under plate ${savedVehicle.plateNumber} joins transit rosters.`, 'System', 'Info');
      }
      return savedVehicle;
    }).catch(err => {
      console.error("API Error", err);
      throw err;
    });
  };

  const updateVehicle = (v: Vehicle) => {
    return api.updateVehicle(v.id, v).then(updatedVehicle => {
      setVehicles((prev) => prev.map((item) => (item.id === v.id ? updatedVehicle : item)));
      appendAuditLog('Update Vehicle Specifications', 'Vehicle Management', `Modified profile specifications or status for license plate ${updatedVehicle.plateNumber}`);
      return updatedVehicle;
    }).catch(err => {
      console.error("API Error updating vehicle", err);
      throw err;
    });
  };

  const deleteVehicle = (id: string) => {
    return api.deleteVehicle(id).then(() => {
      const v = vehicles.find((item) => item.id === id);
      setVehicles((prev) => prev.filter((item) => item.id !== id));
      if (v) {
        appendAuditLog('Retire Vehicle', 'Vehicle Management', `Removed transport vehicle ${v.model} (${v.plateNumber}) from enterprise active database`);
      }
    }).catch(err => {
      console.error("API Error", err);
      throw err;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // 5. Trip Operations - NOW CONNECTED TO API
  // ═══════════════════════════════════════════════════════════
  const addTrip = (tData: Omit<Trip, 'id'>) => {
    const newT = { ...tData };
    api.createTrip(newT).then(savedTrip => {
      setTrips((prev) => [...prev, savedTrip]);
      appendAuditLog('Schedule Command Trip', 'Trip Management', `Scheduled enterprise ride route transit Trip ID: ${savedTrip.id}`);
    }).catch(err => console.error("API Error creating trip", err));
  };

  const updateTrip = (trip: Trip) => {
    api.updateTrip(trip.id, trip).then(updatedTrip => {
      setTrips((prev) => prev.map((t) => (t.id === trip.id ? updatedTrip : t)));
      appendAuditLog('Update Trip Log', 'Trip Management', `State transitions edited for Trip ID: ${updatedTrip.id} - Status changed to ${updatedTrip.status}`);
    }).catch(err => console.error("API Error updating trip", err));
  };

  const deleteTrip = (id: string) => {
    api.deleteTrip(id).then(() => {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      appendAuditLog('Cancel Scheduled Trip', 'Trip Management', `Cancelled and pruned transit log records for Trip ID: ${id}`);
    }).catch(err => console.error("API Error deleting trip", err));
  };

  // ═══════════════════════════════════════════════════════════
  // 8. Vendor Operations - CONNECTED TO API
  // ═══════════════════════════════════════════════════════════
  const addVendor = (vData: Omit<Vendor, 'id'>) => {
    const newV = { ...vData };
    api.createVendor(newV).then(savedVendor => {
      setVendors((prev) => [...prev, savedVendor]);
      appendAuditLog('Onboard Transport Vendor Partner', 'Vendor Management', `Completed system registration for contract logistics agency: ${savedVendor.name}`);
    }).catch(err => console.error("API Error", err));
  };

  const updateVendor = (vendor: Vendor) => {
    api.updateVendor(vendor.id, vendor).then(updatedVendor => {
      setVendors((prev) => prev.map((v) => (v.id === vendor.id ? updatedVendor : v)));
      appendAuditLog('Adjust Vendor SLA Metadata', 'Vendor Management', `Updated SLA index and fleets of service partner: ${updatedVendor.name}`);
    }).catch(err => console.error("API Error updating vendor", err));
  };

  const deleteVendor = (id: string) => {
    api.deleteVendor(id).then(() => {
      const v = vendors.find((vendor) => vendor.id === id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
      if (v) {
        appendAuditLog('Remove Onboarded Partner Agency', 'Vendor Management', `Revoked and purged credentials registration for vendor partner ${v.name}`);
      }
    }).catch(err => console.error("API Error", err));
  };

  // ═══════════════════════════════════════════════════════════
  // 9. Booking Operations - NOW CONNECTED TO API
  // ═══════════════════════════════════════════════════════════
  const addBooking = (bData: Omit<Booking, 'id'>) => {
    const newB = { ...bData };
    api.createBooking(newB).then(savedBooking => {
      setBookings((prev) => [...prev, savedBooking]);
      appendAuditLog('Register Ad-Hoc Call Request', 'Booking Management', `Ad-Hoc ride logged for passenger ${savedBooking.passengerName} and dispatch on date ${savedBooking.bookingDate}`);
      createNotification(
        'New Cab Booking Filed',
        `Passenger ride dispatch requested for date ${savedBooking.bookingDate} at time ${savedBooking.rideTime}. Pending HR allocation.`,
        'Trip',
        'Info'
      );
    }).catch(err => console.error("API Error creating booking", err));
  };

  const updateBooking = (booking: Booking) => {
    api.updateBooking(booking.id, booking).then(updatedBooking => {
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? updatedBooking : b)));
      appendAuditLog('Alter Booking Specification', 'Booking Management', `Modified timing schedules / coordinates for ride reservation BK ID ${updatedBooking.id}`);
    }).catch(err => console.error("API Error updating booking", err));
  };

  const approveBooking = (id: string, stage: 'manager' | 'hr', decision: 'Approved' | 'Rejected') => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    const updateData: Partial<Booking> = stage === 'manager'
      ? { managerApproval: decision }
      : { hrStatus: decision };

    api.updateBooking(id, updateData).then(updatedBooking => {
      setBookings((prev) => prev.map((b) => (b.id === id ? updatedBooking : b)));
      appendAuditLog(
        `Booking Approval Response - ${stage.toUpperCase()}`,
        'Booking Management',
        `Decision status for Booking reservation ${id} set to '${decision}' during ${stage} review phase.`
      );
      createNotification(
        `Ride Booking ${id} - Reviewed`,
        `Commute booking request for ${booking.passengerName} has been marked as ${decision} by ${stage === 'manager' ? 'Line Manager' : 'HR Portal Ops'}.`,
        'Trip',
        decision === 'Approved' ? 'Info' : 'Warning'
      );
    }).catch(err => console.error("API Error approving booking", err));
  };

  const allocateBookingToTrip = (bookingId: string, tripId: string) => {
    api.updateBooking(bookingId, { hrStatus: 'Allocated' as any, tripId }).then(updatedBooking => {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updatedBooking : b)));
      appendAuditLog(
        'Allocate Commute Ride seat',
        'Booking Management',
        `Bound commute request ${bookingId} with dispatch route carrier Trip ${tripId}`
      );
    }).catch(err => console.error("API Error allocating booking", err));
  };

  const deleteBooking = (id: string) => {
    api.deleteBooking(id).then(() => {
      setBookings((prev) => prev.filter((b) => b.id !== id));
      appendAuditLog('Erase Ride Booking reservation', 'Booking Management', `Erased commute reservation database record: ${id}`);
    }).catch(err => console.error("API Error deleting booking", err));
  };

  // ═══════════════════════════════════════════════════════════
  // 10. Fuel Log Operations - NOW CONNECTED TO API ✅
  // ═══════════════════════════════════════════════════════════
  const addFuelLog = (logData: Omit<FuelLog, 'id'>) => {
    const newL = { ...logData };
    api.createFuelLog(newL).then(savedLog => {
      setFuelLogs((prev) => [savedLog, ...prev]);
      const v = vehicles.find((vehicle) => vehicle.id === savedLog.vehicleId);
      appendAuditLog(
        'Log Fueling / Electric Charge Session',
        'Fuel Management',
        `Logged energy replenishment of ${savedLog.quantity} ${savedLog.energyType === 'Electric' ? 'kWh' : 'Liters'} on plate ${v?.plateNumber || 'Unknown vehicle'} (Cost: $${savedLog.cost})`
      );
    }).catch(err => console.error("API Error creating fuel log", err));
  };

  // ═══════════════════════════════════════════════════════════
  // 11. Maintenance Log Operations - NOW CONNECTED TO API ✅
  // ═══════════════════════════════════════════════════════════
  const addMaintenanceLog = (logData: Omit<MaintenanceLog, 'id'>) => {
    const newM = { ...logData };
    api.createMaintenanceLog(newM).then(savedLog => {
      setMaintenanceLogs((prev) => [savedLog, ...prev]);
      const v = vehicles.find((vehicle) => vehicle.id === savedLog.vehicleId);
      appendAuditLog(
        'Initiate Maintenance Operation Log',
        'Maintenance Management',
        `Registered maintenance work tier [${savedLog.category}] for plate ${v?.plateNumber || 'Unknown'} (Budget: $${savedLog.cost})`
      );
      // Immediately refresh vehicles to sync status dashboard
      api.getVehicles().then(setVehicles).catch(err => console.log('Failed to fetch vehicles', err));
    }).catch(err => console.error("API Error creating maintenance log", err));
  };

  const updateMaintenanceLog = (log: MaintenanceLog) => {
    api.updateMaintenanceLog(log.id, log).then(updatedLog => {
      setMaintenanceLogs((prev) => prev.map((m) => (m.id === log.id ? updatedLog : m)));
      appendAuditLog(
        'Modify Fleet Maintenance Status',
        'Maintenance Management',
        `Updated mechanical service outcomes to [${updatedLog.status}] for repair ticket: ${updatedLog.id}`
      );

      // Handle lastServiceDate if completed
      if (updatedLog.status === 'Completed') {
        const vehicleToUpdate = vehicles.find(v => v.id === updatedLog.vehicleId);
        if (vehicleToUpdate) {
          api.updateVehicle(vehicleToUpdate.id, { lastServiceDate: updatedLog.endDate }).then(() => {
            // Refresh vehicles to sync status and lastServiceDate
            api.getVehicles().then(setVehicles).catch(err => console.log('Failed to fetch vehicles', err));
          }).catch(err => console.error("API Error updating vehicle last service date", err));
          return;
        }
      }

      // Refresh vehicles for all other status updates
      api.getVehicles().then(setVehicles).catch(err => console.log('Failed to fetch vehicles', err));
    }).catch(err => console.error("API Error updating maintenance log", err));
  };

  // ═══════════════════════════════════════════════════════════
  // 12. Compliance Doc Operations - NOW CONNECTED TO API ✅
  // ═══════════════════════════════════════════════════════════
  const addComplianceDoc = (docData: Omit<ComplianceDoc, 'id'>) => {
    const newC = { ...docData };
    api.createComplianceDoc(newC).then(savedDoc => {
      setComplianceDocs((prev) => [...prev, savedDoc]);
      appendAuditLog(
        'Register Auditable Security Compliance Entry',
        'Compliance Management',
        `Logged audit document validation for ${savedDoc.entityType} (Plate/Driver ID: ${savedDoc.entityId}) under license type ${savedDoc.documentType}`
      );
    }).catch(err => console.error("API Error creating compliance doc", err));
  };

  const updateComplianceDoc = (doc: ComplianceDoc) => {
    api.updateComplianceDoc(doc.id, doc).then(updatedDoc => {
      setComplianceDocs((prev) => prev.map((c) => (c.id === doc.id ? updatedDoc : c)));
      appendAuditLog(
        'Revalidate Compliance Certificate',
        'Compliance Management',
        `Update compliance registry metadata and status values to ${updatedDoc.status} for license index ${updatedDoc.documentNumber}`
      );
    }).catch(err => console.error("API Error updating compliance doc", err));
  };

  const deleteComplianceDoc = (id: string) => {
    api.deleteComplianceDoc(id).then(() => {
      setComplianceDocs((prev) => prev.filter((c) => c.id !== id));
      appendAuditLog('Prune Auditable Compliance Record', 'Compliance Management', `Eradicated validation index log: ${id}`);
    }).catch(err => console.error("API Error deleting compliance doc", err));
  };

  // ═══════════════════════════════════════════════════════════
  // 14. Notification Operations - NOW CONNECTED TO API ✅
  // ═══════════════════════════════════════════════════════════
  const markNotificationRead = (id: string) => {
    const role = localStorage.getItem('userRole') || 'SUPER_ADMIN';
    if (role === 'COMPANY_HEAD' || role === 'COMPANY_HR') {
      api.readCompanyNotification(Number(id)).then(() => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      }).catch(() => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      });
      return;
    }
    api.updateNotification(id as any, { read: true }).then(updatedNotif => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? updatedNotif : n)));
    }).catch(() => {
      // Fallback to local state
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    });
  };

  const activePopupNotifications = notifications.filter(n => !n.popup_dismissed);

  const markAllNotificationsRead = () => {
    api.markAllNotificationsRead().then(() => {
      setNotifications((prev) => prev.map((n) => n.popup_dismissed ? n : { ...n, read: true }));
      appendAuditLog('Clear Notifications counter', 'Notifications', 'User dismissed and marked all pending messages alerts read.');
    }).catch(console.error);
  };

  const clearNotifications = () => {
    api.clearAllNotifications().then(() => {
      setNotifications((prev) => prev.map(n => ({ ...n, popup_dismissed: true })));
      appendAuditLog('Flush System Alerts log', 'Notifications', 'All general alerts historical registers fully flushed.');
    }).catch(console.error);
  };

  const clearAllNotifications = () => {
    clearNotifications();
  };

  const addNotification = (notifData: { title: string; message: string; targetRole?: string }) => {
    const newAlert: AppNotification = {
      id: Date.now(),
      title: notifData.title,
      message: notifData.message,
      category: 'System',
      severity: 'Info',
      timestamp: 'Just now',
      read: false,
      targetRole: notifData.targetRole
    };
    api.createNotification(newAlert).then(savedNotif => {
      setNotifications((prev) => [savedNotif, ...prev]);
      appendAuditLog('Broadcast Notification', 'Notifications', `Broadcasted alert: ${notifData.title}`);
    }).catch(() => {
      setNotifications((prev) => [newAlert, ...prev]);
    });
  };

  const updateSystemSettings = (newSettings: typeof systemSettings) => {
    setSystemSettings(newSettings);
    appendAuditLog('Update System Settings', 'Settings', `Modified system parameters configuration`);
  };

  // ═══════════════════════════════════════════════════════════
  // 15. System Settings Operations - NOW CONNECTED TO API ✅
  // ═══════════════════════════════════════════════════════════
  const updateSetting = (key: string, value: string) => {
    const setting = settings.find(item => item.key === key);
    if (setting) {
      api.updateSetting(setting.id, { value }).then(updatedSetting => {
        setSettings((prev) => prev.map((item) => (item.key === key ? updatedSetting : item)));
        appendAuditLog(
          'Adjust Global System Setup Settings',
          'Settings',
          `SuperAdmin updated core operational constant [${key}] value context to '${value}'`
        );
      }).catch(err => console.error("API Error updating setting", err));
    } else {
      // Fallback for local-only settings
      setSettings((prev) => prev.map((item) => (item.key === key ? { ...item, value } : item)));
      appendAuditLog(
        'Adjust Global System Setup Settings',
        'Settings',
        `SuperAdmin updated core operational constant [${key}] value context to '${value}'`
      );
    }
  };

  return (
    <CMSContext.Provider
      value={{
        isAuthenticated,
        isInitializing,
        login,
        logout,
        currentUser: currentUser!,
        setCurrentUser,
        availableUsers: [],
        activeModule,
        setActiveModule,
        drivers,
        driverDrafts,
        vehicles,
        trips,
        vendors,
        bookings,
        fuelLogs,
        maintenanceLogs,
        complianceDocs,
        notifications,
        activePopupNotifications,
        auditLogs,
        settings,
        addDriver,
        updateDriver,
        deleteDriver,
        addDriverDraft,
        updateDriverDraft,
        deleteDriverDraft,
        submitDriverDraft,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addTrip,
        updateTrip,
        deleteTrip,
        addVendor,
        updateVendor,
        deleteVendor,
        addBooking,
        updateBooking,
        approveBooking,
        allocateBookingToTrip,
        deleteBooking,
        addFuelLog,
        addMaintenanceLog,
        updateMaintenanceLog,
        addComplianceDoc,
        updateComplianceDoc,
        deleteComplianceDoc,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        clearAllNotifications,
        addNotification,
        systemSettings,
        updateSystemSettings,
        updateSetting,
        hasPermission
      }}
    >
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used inside the bounds of a CMSProvider structure');
  }
  return context;
};
