import re

with open(r'd:\Cab_Management_system\backend\routes\all_routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_dep(router_name, method, action, module_name, content):
    pattern = rf'(@{router_name}\.{method}\(.*?\)\s*def [^\(]+\(.*?)current_user:\s*models\.User\s*=\s*Depends\(get_current_user\)(.*?:)'
    replacement = rf'\1current_user: models.User = Depends(require_permission("{module_name}", "{action}"))\2'
    return re.sub(pattern, replacement, content, flags=re.DOTALL)

# User routes
content = replace_dep('user_router', 'get', 'view', 'user_roles', content)
content = replace_dep('user_router', 'post', 'create', 'user_roles', content)
content = replace_dep('user_router', 'put', 'update', 'user_roles', content)
content = replace_dep('user_router', 'delete', 'delete', 'user_roles', content)

# Export routes - let's skip unless we have an export module, or map them to reports_analytics.
# Wait, let's check what export router has.

# Support Tickets
content = replace_dep('support_router', 'get', 'view', 'support_tickets', content)
content = replace_dep('support_router', 'post', 'create', 'support_tickets', content)
content = replace_dep('support_router', 'put', 'update', 'support_tickets', content)
content = replace_dep('support_router', 'delete', 'delete', 'support_tickets', content)

with open(r'd:\Cab_Management_system\backend\routes\all_routes.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
