from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine
from models import all_models as models
from routes.all_routes import (
    company_announcement_router,
    auth_router, vehicle_router, driver_router, driver_draft_router,
    booking_router, trip_router, contract_router, vendor_router
)
from routes.all_routes import (
    company_announcement_router,
    fuel_log_router, maintenance_log_router, compliance_doc_router,
    app_notification_router, system_setting_router,
    contract_service_router, contract_document_router, contract_note_router,
    contract_payment_router, audit_log_router, contract_activity_log_router,
    contract_payment_router, audit_log_router, contract_activity_log_router,
    upload_router, document_router, export_router, dashboard_router, user_router, support_router
)
from routes.super_admin import super_admin_router


from fastapi.staticfiles import StaticFiles
import os
import json

# Create uploads directory if it doesn't exist
if not os.path.exists("uploads"):
    os.makedirs("uploads")

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response

class ErrorLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if response.status_code >= 400:
            with open("error_log.txt", "a") as f:
                f.write(f"{request.method} {request.url} -> {response.status_code}\n")
        return response

# Auto-generate DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cab Management Architecture Refactored API")
app.add_middleware(ErrorLoggerMiddleware)


# Mount uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(auth_router)
app.include_router(vehicle_router)
app.include_router(driver_router)
app.include_router(driver_draft_router)
app.include_router(booking_router)
app.include_router(export_router)
app.include_router(dashboard_router)
app.include_router(user_router)
app.include_router(support_router)
app.include_router(super_admin_router)
app.include_router(trip_router)
app.include_router(contract_router)
app.include_router(vendor_router)
app.include_router(upload_router)
app.include_router(fuel_log_router)
app.include_router(maintenance_log_router)
app.include_router(compliance_doc_router)
app.include_router(app_notification_router)
app.include_router(system_setting_router)
app.include_router(contract_service_router)
app.include_router(contract_document_router)
app.include_router(contract_note_router)
app.include_router(contract_payment_router)
app.include_router(audit_log_router)
app.include_router(company_announcement_router)
app.include_router(contract_activity_log_router)
app.include_router(document_router)
@app.get("/")
def health_check():
    return {"status": "ok", "architecture": "MVC FastAPI"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    from fastapi.responses import Response
    return Response(content=b"", media_type="image/x-icon")

from routes.all_routes import contract_buyer_router, contract_client_router, contract_financial_router, contract_consignee_router, contract_vehicle_req_router, contract_sla_router, contract_renewal_router

app.include_router(contract_buyer_router)
app.include_router(contract_client_router)
app.include_router(contract_financial_router)
app.include_router(contract_consignee_router)
app.include_router(contract_vehicle_req_router)
app.include_router(contract_sla_router)
app.include_router(contract_renewal_router)
