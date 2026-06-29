import re

with open(r'd:\Cab_Management_system\backend\routes\super_admin.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_routes = """
@super_admin_router.get("/matrix-permissions")
def get_matrix_permissions(company_id: int, role_name: str, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.company_id == company_id, Role.name == role_name).first()
    if not role:
        return []
    perms = db.query(Permission).filter(Permission.role_id == role.id).all()
    return [{"module": p.module, "action": p.action, "enabled": True} for p in perms]

@super_admin_router.put("/matrix-permissions")
def update_matrix_permissions(company_id: int, role_name: str, permissions: List[PermissionUpdate], request: Request, current_admin: SuperAdmin = Depends(get_current_admin), db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.company_id == company_id, Role.name == role_name).first()
    if not role:
        role = Role(name=role_name, description=f"{role_name.replace('_', ' ').title()} Role", company_id=company_id)
        db.add(role)
        db.commit()
        db.refresh(role)
        log_auth_event(db, request, current_admin.email, "super_admin", f"Created Auto-Role: {role_name} for Company {company_id}", "Success", current_admin.name, "CMS Enterprise")

    db.query(Permission).filter(Permission.role_id == role.id).delete()
    
    new_perms = []
    for p in permissions:
        if p.enabled:
            new_perms.append(Permission(role_id=role.id, module=p.module, action=p.action))
            
    if new_perms:
        db.bulk_save_objects(new_perms)
        
    db.commit()
    log_auth_event(db, request, current_admin.email, "super_admin", f"Updated Matrix Permissions for {role_name} (Company {company_id})", "Success", current_admin.name, "CMS Enterprise")
    
    return {"message": "Permissions updated successfully"}
"""

if "def get_matrix_permissions" not in content:
    content += "\n" + new_routes

with open(r'd:\Cab_Management_system\backend\routes\super_admin.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added matrix routes to super_admin.py")
