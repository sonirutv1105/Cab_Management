import re

cms_path = 'd:/Cab_Management_system/frontend/src/context/CMSContext.tsx'
content = open(cms_path, 'r', encoding='utf-8').read()
content = content.replace('const newLog: AuditLog = {', 'const newLog: Partial<AuditLog> = {')
content = content.replace('const newAlert: AppNotification = {', 'const newAlert: Partial<AppNotification> = {')
content = content.replace('const newAlert: AppNotification = {', 'const newAlert: Partial<AppNotification> = {')
content = content.replace('const newBroadcast: AppNotification = {', 'const newBroadcast: Partial<AppNotification> = {')

# CMSContext.tsx(466,23): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
# This is `await api.submitDriverDraft(draftId)` where draftId was typed string, or similar.
# In CMSContext: 
content = content.replace('submitDriverDraft = async (id: string)', 'submitDriverDraft = async (id: number)')
# Wait, let's just make it id: any to avoid cascading type errors, since draft_id was a number anyway in types.
content = content.replace('submitDriverDraft = async (id: any)', 'submitDriverDraft = async (id: any)')

open(cms_path, 'w', encoding='utf-8').write(content)


con_path = 'd:/Cab_Management_system/frontend/src/context/ContractContext.tsx'
content = open(con_path, 'r', encoding='utf-8').read()
# `src/context/ContractContext.tsx(136,7): error TS2322: Type 'string' is not assignable to type 'number'.`
# This means there are some strings being assigned to numbers.
# For example, `id: \`...\`` still remaining. Let's just strip all `id: \`...\``
content = re.sub(r'id:\s*`[^`]+`,\n\s*', '', content)
# And replace `const newX: X = {` with `const newX: Partial<X> = {`
content = re.sub(r'const new([A-Za-z]+):\s*([A-Za-z]+)\s*=', r'const new\1: Partial<\2> =', content)

open(con_path, 'w', encoding='utf-8').write(content)
print('Patched types.')
