import sys

file_path = 'd:/Cab_Management_system/backend/routes/all_routes.py'
content = open(file_path, 'r', encoding='utf-8').read()

helper = '''
def validate_vendor_for_driver(db, company_id, vendor_id, vehicle_assignment_type):
    if vehicle_assignment_type == 'Self Car':
        return
    vendor_count = db.query(models.Vendor).filter(models.Vendor.company_id == company_id).count()
    if vendor_count > 0 and not vendor_id:
        raise HTTPException(status_code=400, detail="Vendor is required")
'''

if 'def validate_vendor_for_driver' not in content:
    # insert helper after imports
    content = content.replace('def get_current_user(', helper + '\n\ndef get_current_user(')

create_find = '''    driver_dict = driver.model_dump()
    driver_dict['company_id'] = current_user.company_id'''
create_replace = create_find + '''
    validate_vendor_for_driver(db, current_user.company_id, driver_dict.get('vendorId'), driver_dict.get('vehicleAssignmentType'))'''
content = content.replace(create_find, create_replace)

update_find = '''    update_data = driver.model_dump(exclude_unset=True)'''
update_replace = update_find + '''
    new_vendor_id = update_data.get('vendorId', db_item.vendorId)
    # The driver model stores vehicleAssignmentType as a dynamic property or JSON in some implementations, but in schemas it's passed.
    # We can check update_data or fallback to None (which means it's not a Self Car or it wasn't updated).
    new_assignment_type = update_data.get('vehicleAssignmentType', getattr(db_item, 'vehicleAssignmentType', None))
    validate_vendor_for_driver(db, current_user.company_id, new_vendor_id, new_assignment_type)'''
content = content.replace(update_find, update_replace)

draft_find = '''    # Map draft fields to Driver model
    driver_dict = {'''
draft_replace = '''    validate_vendor_for_driver(db, current_user.company_id, db_item.vendor_id, db_item.vehicle_assignment_type)
    
    # Map draft fields to Driver model
    driver_dict = {'''
content = content.replace(draft_find, draft_replace)

open(file_path, 'w', encoding='utf-8').write(content)
print("Patched all_routes.py")
