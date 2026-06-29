import sys
import re

# PATCH 1: client.ts
client_path = 'd:/Cab_Management_system/frontend/src/api/client.ts'
content = open(client_path, 'r', encoding='utf-8').read()

replacements_client = [
    ("createDriver: (driver: Driver) => apiClient.post<Driver>('/drivers/', driver)", "createDriver: (driver: Partial<Driver>) => apiClient.post<Driver>('/drivers/', driver)"),
    ("createVehicle: (vehicle: Vehicle) => apiClient.post<Vehicle>('/vehicles/', vehicle)", "createVehicle: (vehicle: Partial<Vehicle>) => apiClient.post<Vehicle>('/vehicles/', vehicle)"),
    ("createTrip: (trip: Trip) => apiClient.post<Trip>('/routes/', trip)", "createTrip: (trip: Partial<Trip>) => apiClient.post<Trip>('/routes/', trip)"),
    ("createVendor: (vendor: Vendor) => apiClient.post<Vendor>('/vendors/', vendor)", "createVendor: (vendor: Partial<Vendor>) => apiClient.post<Vendor>('/vendors/', vendor)"),
    ("createBooking: (booking: Booking) => apiClient.post<Booking>('/bookings/', booking)", "createBooking: (booking: Partial<Booking>) => apiClient.post<Booking>('/bookings/', booking)"),
    ("createFuelLog: (log: FuelLog) => apiClient.post<FuelLog>('/fuel-logs/', log)", "createFuelLog: (log: Partial<FuelLog>) => apiClient.post<FuelLog>('/fuel-logs/', log)"),
    ("createMaintenanceLog: (log: MaintenanceLog) => apiClient.post<MaintenanceLog>('/maintenance/', log)", "createMaintenanceLog: (log: Partial<MaintenanceLog>) => apiClient.post<MaintenanceLog>('/maintenance/', log)"),
    ("createComplianceDoc: (doc: ComplianceDoc) => apiClient.post<ComplianceDoc>('/compliance/', doc)", "createComplianceDoc: (doc: Partial<ComplianceDoc>) => apiClient.post<ComplianceDoc>('/compliance/', doc)"),
]

for old, new in replacements_client:
    content = content.replace(old, new)

open(client_path, 'w', encoding='utf-8').write(content)
print("Patched client.ts")

# PATCH 2: CMSContext.tsx
cms_path = 'd:/Cab_Management_system/frontend/src/context/CMSContext.tsx'
cms_content = open(cms_path, 'r', encoding='utf-8').read()

cms_content = re.sub(r'const id = `drv_\$\{Date\.now\(\)\}`;?\s*const newDrv: Driver = { \.\.\.drvData, id };?', 'const newDrv = { ...drvData };', cms_content)
cms_content = re.sub(r'const id = `drv_draft_\$\{Date\.now\(\)\}`;?\s*const newDrv = { \.\.\.draftData, draft_id: id };?', 'const newDrv = { ...draftData };', cms_content)
cms_content = re.sub(r'const id = `vh_\$\{Date\.now\(\)\}`;?\s*const newVh: Vehicle = { \.\.\.vData, id };?', 'const newVh = { ...vData };', cms_content)
cms_content = re.sub(r'const id = `tr_\$\{Date\.now\(\)\}`;?\s*const newT: Trip = { \.\.\.tData, id };?', 'const newT = { ...tData };', cms_content)
cms_content = re.sub(r'const id = `vnd_\$\{Date\.now\(\)\}`;?\s*const newV: Vendor = { \.\.\.vData, id };?', 'const newV = { ...vData };', cms_content)
cms_content = re.sub(r'const id = `bk_\$\{Date\.now\(\)\}`;?\s*const newB: Booking = { \.\.\.bData, id };?', 'const newB = { ...bData };', cms_content)
cms_content = re.sub(r'const id = `fl_\$\{Date\.now\(\)\}`;?\s*const newL: FuelLog = { \.\.\.logData, id };?', 'const newL = { ...logData };', cms_content)
cms_content = re.sub(r'const id = `mt_\$\{Date\.now\(\)\}`;?\s*const newM: MaintenanceLog = { \.\.\.logData, id };?', 'const newM = { ...logData };', cms_content)
cms_content = re.sub(r'const id = `comp_\$\{Date\.now\(\)\}`;?\s*const newC: ComplianceDoc = { \.\.\.docData, id };?', 'const newC = { ...docData };', cms_content)

open(cms_path, 'w', encoding='utf-8').write(cms_content)
print("Patched CMSContext.tsx")
