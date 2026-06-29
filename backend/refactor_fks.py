import re

with open("models/all_models.py", "r") as f:
    content = f.read()

replacements = {
    r'vendorId = Column\(String\(\d+\)\)': "vendorId = Column(String(100), ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True)",
    r'vendorId = Column\(String\(\d+\), nullable=True\)': "vendorId = Column(String(100), ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True)",
    
    r'assignedVehicleId = Column\(String\(\d+\), nullable=True\)': "assignedVehicleId = Column(String(100), ForeignKey('vehicles.id', ondelete='SET NULL'), nullable=True)",
    r'assigned_vehicle_id = Column\(String\(\d+\), nullable=True\)': "assigned_vehicle_id = Column(String(100), ForeignKey('vehicles.id', ondelete='SET NULL'), nullable=True)",
    
    r'assignedDriverId = Column\(String\(\d+\), nullable=True\)': "assignedDriverId = Column(String(100), ForeignKey('drivers.id', ondelete='SET NULL'), nullable=True)",
    
    r'driverId = Column\(String\(\d+\)\)': "driverId = Column(String(100), ForeignKey('drivers.id', ondelete='CASCADE'), nullable=True)",
    r'driverId = Column\(String\(\d+\), nullable=True\)': "driverId = Column(String(100), ForeignKey('drivers.id', ondelete='CASCADE'), nullable=True)",
    r'driver_id = Column\(String\(\d+\), index=True\)': "driver_id = Column(String(100), ForeignKey('drivers.id', ondelete='CASCADE'), index=True)",
    
    r'vehicleId = Column\(String\(\d+\)\)': "vehicleId = Column(String(100), ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=True)",
    r'vehicleId = Column\(String\(\d+\), nullable=True\)': "vehicleId = Column(String(100), ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=True)",
    
    r'contractId = Column\(String\(\d+\)\)': "contractId = Column(String(100), ForeignKey('contracts.id', ondelete='CASCADE'), nullable=True)",
    r'contractId = Column\(String\(\d+\), index=True\)': "contractId = Column(String(100), ForeignKey('contracts.id', ondelete='CASCADE'), index=True)",
    r'contract_id = Column\(String\(\d+\), index=True, nullable=True\)': "contract_id = Column(String(100), ForeignKey('contracts.id', ondelete='CASCADE'), index=True, nullable=True)",
    
    r'tripId = Column\(String\(\d+\), nullable=True\)': "tripId = Column(String(100), ForeignKey('trips.id', ondelete='SET NULL'), nullable=True)",
    r'tripId = Column\(String\(\d+\)\)': "tripId = Column(String(100), ForeignKey('trips.id', ondelete='SET NULL'), nullable=True)",
}

for pattern, replacement in replacements.items():
    content = re.sub(pattern, replacement, content)

with open("models/all_models.py", "w") as f:
    f.write(content)

print("Foreign Key replacements completed.")
