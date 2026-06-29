from typing import TypeVar, Generic, Type, Any, Optional, List
from sqlalchemy.orm import Session
from database.db import Base
from pydantic import BaseModel
from fastapi import HTTPException

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100, company_id: Optional[int] = -1) -> List[ModelType]:
        query = db.query(self.model)
        if hasattr(self.model, 'company_id'):
            if company_id is None:
                pass # Super Admin sees all
            elif company_id == -1:
                query = query.filter(self.model.company_id == -1) # Failsafe
            else:
                query = query.filter(self.model.company_id == company_id)
        return query.offset(skip).limit(limit).all()

    def get(self, db: Session, id: Any, company_id: Optional[int] = -1) -> Optional[ModelType]:
        query = db.query(self.model).filter(self.model.id == id)
        if hasattr(self.model, 'company_id'):
            if company_id is None:
                pass # Super Admin sees all
            elif company_id == -1:
                query = query.filter(self.model.company_id == -1) # Failsafe
            else:
                query = query.filter(self.model.company_id == company_id)
        db_item = query.first()
        if not db_item:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")
        return db_item

    def create(self, db: Session, obj_in: CreateSchemaType, company_id: Optional[int] = -1) -> ModelType:
        obj_in_data = obj_in.model_dump()
        if hasattr(self.model, 'company_id'):
            if company_id is None:
                pass # Super Admin can create without company_id? Usually they don't create operational data, but if they do, it might be null
            elif company_id != -1:
                obj_in_data['company_id'] = company_id
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, id: Any, obj_in: UpdateSchemaType, company_id: Optional[int] = -1) -> ModelType:
        db_obj = self.get(db, id, company_id=company_id)
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: Any, company_id: Optional[int] = -1) -> ModelType:
        db_obj = self.get(db, id, company_id=company_id)
        db.delete(db_obj)
        db.commit()
        return db_obj
