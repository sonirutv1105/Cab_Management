from sqlalchemy import text
from database.db import engine

fks = [
    ("vehicles", "assignedDriverId", "drivers", "id", "SET NULL"),
    ("driver_documents", "driverId", "drivers", "id", "CASCADE"),
    ("trips", "driverId", "drivers", "id", "CASCADE"),
    ("trips", "vehicleId", "vehicles", "id", "CASCADE"),
    ("vendors", "vendorId", "vendors", "id", "SET NULL"), # self reference? wait, no. 
    ("vehicles", "vendorId", "vendors", "id", "SET NULL"),
    ("contracts", "vendorId", "vendors", "id", "SET NULL"),
    ("contract_services", "contractId", "contracts", "id", "CASCADE"),
    ("contract_documents", "contractId", "contracts", "id", "CASCADE"),
    ("contract_notes", "contractId", "contracts", "id", "CASCADE"),
    ("contract_payments", "contractId", "contracts", "id", "CASCADE"),
    ("contract_activity_logs", "contractId", "contracts", "id", "CASCADE"),
    ("driver_drafts", "assigned_vehicle_id", "vehicles", "id", "SET NULL"),
    ("driver_drafts", "vendorId", "vendors", "id", "SET NULL"),
    ("fuel_logs", "vehicleId", "vehicles", "id", "CASCADE"),
    ("maintenance_logs", "vehicleId", "vehicles", "id", "CASCADE"),
    ("compliance_docs", "vehicleId", "vehicles", "id", "CASCADE"),
    ("compliance_docs", "driverId", "drivers", "id", "CASCADE"),
    ("contract_drafts", "driver_id", "drivers", "id", "CASCADE"),
    ("contract_buyer_details", "contract_id", "contracts", "id", "CASCADE"),
    ("contract_client_details", "contractId", "contracts", "id", "CASCADE"),
    ("contract_consignee_details", "contractId", "contracts", "id", "CASCADE"),
    ("contract_vehicle_requirements", "contractId", "contracts", "id", "CASCADE"),
    ("contract_sla_compliance", "contractId", "contracts", "id", "CASCADE"),
    ("contract_renewal_termination", "contractId", "contracts", "id", "CASCADE"),
]

def add_fk_constraints():
    with engine.begin() as conn:
        for table, col, ref_table, ref_col, on_delete in fks:
            print(f"Adding FK constraint to {table}.{col} -> {ref_table}.{ref_col}")
            try:
                # To add FK, we need to add constraint. We ignore if exists.
                fk_name = f"fk_{table}_{col}"
                # In MySQL, we can just alter table
                query = f"""
                ALTER TABLE {table} 
                ADD CONSTRAINT {fk_name} 
                FOREIGN KEY ({col}) 
                REFERENCES {ref_table}({ref_col}) 
                ON DELETE {on_delete};
                """
                conn.execute(text(query))
                print(f"Success: {fk_name}")
            except Exception as e:
                print(f"Failed to add {fk_name}: {e}")

if __name__ == "__main__":
    add_fk_constraints()
