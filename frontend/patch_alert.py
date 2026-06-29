import sys

file_path = 'd:/Cab_Management_system/frontend/src/components/DriverManagementView.tsx'
content = open(file_path, 'r', encoding='utf-8').read()

find1 = '''alert("Failed to save draft: " + (e.response?.data?.detail?.[0]?.msg || e.response?.data?.detail || e.message));'''
replace1 = '''alert("Failed to save draft: " + JSON.stringify(e.response?.data?.detail || e.message));'''

find2 = '''alert("Failed to save driver: " + (e.response?.data?.detail?.[0]?.msg || e.response?.data?.detail || e.message));'''
replace2 = '''alert("Failed to save driver: " + JSON.stringify(e.response?.data?.detail || e.message));'''

content = content.replace(find1, replace1)
content = content.replace(find2, replace2)

open(file_path, 'w', encoding='utf-8').write(content)
print("Patched alert messages")
