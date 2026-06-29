import sys

file_path = 'd:/Cab_Management_system/frontend/src/components/TripManagementView.tsx'
content = open(file_path, 'r', encoding='utf-8').read()
content = content.replace("driverId: drivers[0]?.id || 'drv_1'", "driverId: drivers.length > 0 ? drivers[0].id : undefined")
content = content.replace("vehicleId: vehicles[0]?.id || 'vh_1'", "vehicleId: vehicles.length > 0 ? vehicles[0].id : undefined")
open(file_path, 'w', encoding='utf-8').write(content)
print('Patched TripManagementView.tsx')
