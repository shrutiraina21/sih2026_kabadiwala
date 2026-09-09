from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.core.config import MaterialCategory, LotStatus

class LotCreate(BaseModel):
    lot_id: Optional[str] = Field(None, description="Optional client-specified Lot UUID")
    category: MaterialCategory
    declared_weight: float = Field(..., gt=0, description="Declared total weight of this lot in kg")
    recycler_id: Optional[str] = Field(None, description="Optional assigned recycler user ID")

class LotAssignRecycler(BaseModel):
    recycler_id: str = Field(..., description="Target recycler user ID")

class LotResponse(BaseModel):
    lot_id: str
    dealer_id: str
    dealer_name: Optional[str] = None
    category: str
    declared_weight: float
    recycler_id: Optional[str] = None
    recycler_name: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LotLookupResponse(BaseModel):
    lot_id: str
    category: str
    declared_weight: float
    dealer_id: str
    dealer_name: str
    recycler_id: Optional[str] = None
    recycler_name: Optional[str] = None
    status: str
    created_at: datetime
