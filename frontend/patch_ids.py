import sys

file_path = 'd:/Cab_Management_system/frontend/src/components/DriverManagementView.tsx'
content = open(file_path, 'r', encoding='utf-8').read()

replacements = [
    # Initialization from drv (DriverEdit)
    ("assignedVehicleId: drv.assignedVehicleId || '',", "assignedVehicleId: drv.assignedVehicleId || undefined,"),
    # Initialization from draft
    ("assignedVehicleId: draft.assigned_vehicle_id || '',", "assignedVehicleId: draft.assigned_vehicle_id || undefined,"),
    # For drafts the backend keys are different (e.g. assigned_vehicle_id)
    # The payload construction in handleFinalSubmit:
    ("assigned_vehicle_id: formState.assignedVehicleId,", "assigned_vehicle_id: formState.assignedVehicleId || undefined,"),
    ("vendor_id: formState.vendorId,", "vendor_id: formState.vendorId || undefined,"),
]

for old, new in replacements:
    content = content.replace(old, new)

open(file_path, 'w', encoding='utf-8').write(content)
print("Patched DriverManagementView.tsx")
