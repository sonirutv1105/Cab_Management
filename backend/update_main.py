import re

with open(r'd:\Cab_Management_system\backend\main.py', 'r') as f:
    content = f.read()

# Add imports for new routers
imports = """
from routes.all_routes import (
    shift_router, fuel_log_router, maintenance_log_router, compliance_doc_router,
    app_document_router, app_notification_router, system_setting_router,
    contract_service_router, contract_document_router, contract_note_router,
    contract_payment_router, audit_log_router, contract_activity_log_router
)
"""

includes = """
app.include_router(shift_router)
app.include_router(fuel_log_router)
app.include_router(maintenance_log_router)
app.include_router(compliance_doc_router)
app.include_router(app_document_router)
app.include_router(app_notification_router)
app.include_router(system_setting_router)
app.include_router(contract_service_router)
app.include_router(contract_document_router)
app.include_router(contract_note_router)
app.include_router(contract_payment_router)
app.include_router(audit_log_router)
app.include_router(contract_activity_log_router)
"""

# Insert imports after the existing auth_router import
content = content.replace("vendor_router\n)", "vendor_router\n)" + imports)

# Insert includes after app.include_router(vendor_router)
content = content.replace("app.include_router(vendor_router)", "app.include_router(vendor_router)" + includes)

with open(r'd:\Cab_Management_system\backend\main.py', 'w') as f:
    f.write(content)

print("main.py updated successfully.")
