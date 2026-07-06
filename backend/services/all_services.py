from models.all_models import (
    FuelLog, MaintenanceLog, ComplianceDoc,
    AppNotification, SystemSetting, ContractService, ContractDocument,
    ContractNote, ContractPayment, AuditLog, ContractActivityLog, Vehicle
)
from sqlalchemy.orm import Session
from typing import Any, Optional
from validations.all_schemas import (
    FuelLogCreate, FuelLogUpdate,
    MaintenanceLogCreate, MaintenanceLogUpdate,
    ComplianceDocCreate, ComplianceDocUpdate,
    AppNotificationCreate, AppNotificationUpdate,
    SystemSettingCreate, SystemSettingUpdate,
    ContractServiceCreate, ContractServiceUpdate,
    ContractDocumentCreate, ContractDocumentUpdate,
    ContractNoteCreate, ContractNoteUpdate,
    ContractPaymentCreate, ContractPaymentUpdate,
    AuditLogCreate, BaseModel,
    ContractActivityLogCreate
)
from services.base_service import BaseService

fuel_log_service = BaseService[FuelLog, FuelLogCreate, FuelLogUpdate](FuelLog)

class MaintenanceLogService(BaseService[MaintenanceLog, MaintenanceLogCreate, MaintenanceLogUpdate]):
    def _update_vehicle_status(self, db: Session, vehicle_id: int):
        if not vehicle_id:
            return
        
        active_logs = db.query(MaintenanceLog).filter(
            MaintenanceLog.vehicleId == vehicle_id,
            MaintenanceLog.status.in_(["Scheduled", "In Progress", "Upcoming"])
        ).count()

        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if vehicle:
            if active_logs > 0:
                if vehicle.status != "Under Maintenance":
                    vehicle.status = "Under Maintenance"
            else:
                if vehicle.status == "Under Maintenance":
                    vehicle.status = "Available"
            db.commit()

    def create(self, db: Session, obj_in: MaintenanceLogCreate, company_id: Optional[int] = -1) -> MaintenanceLog:
        db_obj = super().create(db, obj_in, company_id)
        self._update_vehicle_status(db, db_obj.vehicleId)
        return db_obj

    def update(self, db: Session, id: Any, obj_in: MaintenanceLogUpdate, company_id: Optional[int] = -1) -> MaintenanceLog:
        old_obj = self.get(db, id, company_id)
        old_vehicle_id = old_obj.vehicleId

        db_obj = super().update(db, id, obj_in, company_id)
        
        self._update_vehicle_status(db, db_obj.vehicleId)
        if old_vehicle_id and old_vehicle_id != db_obj.vehicleId:
            self._update_vehicle_status(db, old_vehicle_id)

        return db_obj

    def delete(self, db: Session, id: Any, company_id: Optional[int] = -1) -> MaintenanceLog:
        db_obj = self.get(db, id, company_id)
        vehicle_id = db_obj.vehicleId
        
        deleted_obj = super().delete(db, id, company_id)
        
        self._update_vehicle_status(db, vehicle_id)
        return deleted_obj

maintenance_log_service = MaintenanceLogService(MaintenanceLog)
compliance_doc_service = BaseService[ComplianceDoc, ComplianceDocCreate, ComplianceDocUpdate](ComplianceDoc)
app_notification_service = BaseService[AppNotification, AppNotificationCreate, AppNotificationUpdate](AppNotification)
system_setting_service = BaseService[SystemSetting, SystemSettingCreate, SystemSettingUpdate](SystemSetting)

contract_service_service = BaseService[ContractService, ContractServiceCreate, ContractServiceUpdate](ContractService)
contract_document_service = BaseService[ContractDocument, ContractDocumentCreate, ContractDocumentUpdate](ContractDocument)
contract_note_service = BaseService[ContractNote, ContractNoteCreate, ContractNoteUpdate](ContractNote)
contract_payment_service = BaseService[ContractPayment, ContractPaymentCreate, ContractPaymentUpdate](ContractPayment)

# Audit logs and activity logs typically don't have updates
class EmptyUpdateSchema(BaseModel):
    pass

audit_log_service = BaseService[AuditLog, AuditLogCreate, EmptyUpdateSchema](AuditLog)
contract_activity_log_service = BaseService[ContractActivityLog, ContractActivityLogCreate, EmptyUpdateSchema](ContractActivityLog)
