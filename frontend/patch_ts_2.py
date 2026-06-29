import sys
import re

# PATCH 1: client.ts
client_path = 'd:/Cab_Management_system/frontend/src/api/client.ts'
content = open(client_path, 'r', encoding='utf-8').read()

# I will just replace all `createXXX(xxx: XXX)` with `createXXX(xxx: Partial<XXX>)` for any object
content = re.sub(r'create([A-Za-z]+):\s*\([a-zA-Z]+:\s*([A-Za-z]+)\)\s*=>\s*apiClient\.post<[A-Za-z]+>\([\'"`].*?[\'"`],\s*[a-zA-Z]+\)', 
                 lambda m: m.group(0).replace(m.group(2), f"Partial<{m.group(2)}>"), content)

# Also fix the ones that don't perfectly match the above pattern
content = content.replace("createAuditLog: (log: AuditLog)", "createAuditLog: (log: Partial<AuditLog>)")
content = content.replace("createNotification: (notification: AppNotification)", "createNotification: (notification: Partial<AppNotification>)")
content = content.replace("createBroadcast: (broadcast: AppNotification)", "createBroadcast: (broadcast: Partial<AppNotification>)")
content = content.replace("createContractDraft: (draft: ContractDraft)", "createContractDraft: (draft: Partial<ContractDraft>)")

open(client_path, 'w', encoding='utf-8').write(content)

# PATCH 2: ErrorBoundary.tsx
err_path = 'd:/Cab_Management_system/frontend/src/components/ErrorBoundary.tsx'
err_content = open(err_path, 'r', encoding='utf-8').read()
err_content = err_content.replace('this.props.children as any', '(this.props as any).children')
err_content = err_content.replace('this.props.children', '(this.props as any).children')
open(err_path, 'w', encoding='utf-8').write(err_content)

# PATCH 3: ContractContext.tsx (Some remaining id generation)
con_path = 'd:/Cab_Management_system/frontend/src/context/ContractContext.tsx'
con_content = open(con_path, 'r', encoding='utf-8').read()
con_content = re.sub(r'const id = `[^`]+_\$\{Date\.now\(\)\}`;?\s*const (\w+) = { \.\.\.[^,]+, id };?', r'const \1 = { ...\g<0> };', con_content)
# Let's just remove any `id = ...` and the merge
con_content = re.sub(r'const id = `cnt_draft_\$\{Date\.now\(\)\}`;\s*const newDraft: ContractDraft = { \.\.\.draftData, id };', 'const newDraft = { ...draftData };', con_content)
con_content = re.sub(r'const id = `tsk_\$\{Date\.now\(\)\}`;\s*const newTask: ContractTask = { \.\.\.taskData, id };', 'const newTask = { ...taskData };', con_content)
con_content = re.sub(r'const id = `tnd_\$\{Date\.now\(\)\}`;\s*const newTender: Tender = { \.\.\.tenderData, id };', 'const newTender = { ...tenderData };', con_content)
con_content = re.sub(r'const id = `ntf_\$\{Date\.now\(\)\}`;\s*const newNotif: ContractNotification = { \.\.\.notifData, id };', 'const newNotif = { ...notifData };', con_content)
con_content = re.sub(r'const id = `cnt_\$\{Date\.now\(\)\}`;\s*const newContract: Contract = { \.\.\.contractData, id };', 'const newContract = { ...contractData };', con_content)
open(con_path, 'w', encoding='utf-8').write(con_content)

print("Patched all.")
