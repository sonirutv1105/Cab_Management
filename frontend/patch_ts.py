import sys
import re

# PATCH 1: CMSContext.tsx
cms_path = 'd:/Cab_Management_system/frontend/src/context/CMSContext.tsx'
cms_content = open(cms_path, 'r', encoding='utf-8').read()

# Fix audit logs and notifications
cms_content = re.sub(r'id: `aud_\$\{Date\.now\(\)\}_\$\{Math\.floor\(Math\.random\(\) \* 1000\)\}`,\n\s*', '', cms_content)
cms_content = re.sub(r'id: `notif_\$\{Date\.now\(\)\}`,\n\s*', '', cms_content)

# Fix DriverDraft creation in CMSContext
# wait, my previous regex might have missed the argument casting
cms_content = cms_content.replace('await api.createDriverDraft(newDrv);', 'await api.createDriverDraft(newDrv as any);')
cms_content = cms_content.replace('await api.createMaintenanceLog(newM);', 'await api.createMaintenanceLog(newM as any);')
cms_content = cms_content.replace('await api.createComplianceDoc(newC);', 'await api.createComplianceDoc(newC as any);')

open(cms_path, 'w', encoding='utf-8').write(cms_content)
print("Patched CMSContext.tsx")

# PATCH 2: ContractContext.tsx
con_path = 'd:/Cab_Management_system/frontend/src/context/ContractContext.tsx'
con_content = open(con_path, 'r', encoding='utf-8').read()

# Contracts, Tasks, Tenders
con_content = re.sub(r'id: `cnt_\$\{Date\.now\(\)\}`,\n\s*', '', con_content)
con_content = re.sub(r'const id = `cnt_\$\{Date\.now\(\)\}`;?\s*const newContract = { \.\.\.contractData, id };?', 'const newContract = { ...contractData };', con_content)
con_content = re.sub(r'const id = `tsk_\$\{Date\.now\(\)\}`;?\s*const newTask: ContractTask = { \.\.\.taskData, id };?', 'const newTask = { ...taskData };', con_content)
con_content = re.sub(r'const id = `tnd_\$\{Date\.now\(\)\}`;?\s*const newTender: Tender = { \.\.\.tenderData, id };?', 'const newTender = { ...tenderData };', con_content)
con_content = re.sub(r'const id = `ntf_\$\{Date\.now\(\)\}`;?\s*const newNotif: ContractNotification = { \.\.\.notifData, id };?', 'const newNotif = { ...notifData };', con_content)

# Remove any generated ID fields from inline objects
con_content = re.sub(r'id: `tsk_\$\{Date\.now\(\)\}`,\n\s*', '', con_content)
con_content = re.sub(r'id: `tnd_\$\{Date\.now\(\)\}`,\n\s*', '', con_content)
con_content = re.sub(r'id: `ntf_\$\{Date\.now\(\)\}`,\n\s*', '', con_content)

open(con_path, 'w', encoding='utf-8').write(con_content)
print("Patched ContractContext.tsx")

# PATCH 3: ErrorBoundary and SuperAdminNotifications imports
err_path = 'd:/Cab_Management_system/frontend/src/components/ErrorBoundary.tsx'
err_content = open(err_path, 'r', encoding='utf-8').read()
err_content = err_content.replace('this.props.children', 'this.props.children as any')
open(err_path, 'w', encoding='utf-8').write(err_content)

notif_path = 'd:/Cab_Management_system/frontend/src/components/SuperAdminNotifications.tsx'
notif_content = open(notif_path, 'r', encoding='utf-8').read()
notif_content = notif_content.replace('import { NotificationItem } from "./SuperAdminLayout";', '// import removed')
open(notif_path, 'w', encoding='utf-8').write(notif_content)
