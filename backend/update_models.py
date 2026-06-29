import os

file_path = r"d:\Cab_Management_system\backend\models\all_models.py"
with open(file_path, "r") as f:
    content = f.read()

# Fix User model
old_user = """    lastActive = Column(String(50), default="Just now")
    hashed_password = Column(String(255), nullable=True)"""

new_user = """    lastActive = Column(String(50), default="Just now")
    hashed_password = Column(String(255), nullable=True)
    status = Column(String(50), default="Active")
    created_at = Column(String(50), nullable=True)"""

if old_user in content:
    content = content.replace(old_user, new_user)

# Add Task, Tender, Announcement
models_append = """
class Task(Base):
    __tablename__ = "tasks"
    id = Column(String(100), primary_key=True, index=True)
    company_id = Column(String(100), ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    title = Column(String(200))
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Pending")
    priority = Column(String(50), default="Medium")
    assigned_to = Column(String(100), nullable=True)
    due_date = Column(String(50), nullable=True)
    comments = Column(Text, nullable=True)
    attachments = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class Tender(Base):
    __tablename__ = "tenders"
    id = Column(String(100), primary_key=True, index=True)
    company_id = Column(String(100), ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    title = Column(String(200))
    category = Column(String(100), nullable=True)
    status = Column(String(50), default="Open")
    tender_number = Column(String(100), nullable=True)
    client_name = Column(String(150), nullable=True)
    department = Column(String(100), nullable=True)
    tender_value = Column(Float, nullable=True)
    publish_date = Column(String(50), nullable=True)
    opening_date = Column(String(50), nullable=True)
    closing_date = Column(String(50), nullable=True)
    deadline = Column(String(50), nullable=True)
    assigned_manager = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    documents = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(String(100), primary_key=True, index=True)
    company_id = Column(String(100), ForeignKey('companies.id', ondelete='CASCADE'), index=True, nullable=True)
    title = Column(String(200))
    content = Column(Text, nullable=True)
    date = Column(String(50), nullable=True)
    type = Column(String(50), default="Info")
    status = Column(String(50), default="Active")
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)
"""

if "class Task(Base):" not in content:
    content += models_append

with open(file_path, "w") as f:
    f.write(content)

print("Updated all_models.py successfully.")
