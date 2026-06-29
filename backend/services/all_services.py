from models.all_models import (
    FuelLog, MaintenanceLog, ComplianceDoc,
    AppNotification, SystemSetting, ContractService, ContractDocument,
    ContractNote, ContractPayment, AuditLog, ContractActivityLog
)
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
maintenance_log_service = BaseService[MaintenanceLog, MaintenanceLogCreate, MaintenanceLogUpdate](MaintenanceLog)
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
