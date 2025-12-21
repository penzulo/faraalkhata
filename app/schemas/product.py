from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from datetime import datetime
from uuid import UUID


class ProductBase(BaseModel):
    name: str
    unit_of_measure: str = Field(default="kg")
    sell_price: Decimal = Field(ge=0)
    current_stock: Decimal = Field(default=Decimal(0))
    is_active: bool = True


class ProductCreate(ProductBase):
    initial_cost_price: Decimal = Field(default=Decimal(0), ge=Decimal(0))


class ProductResponse(ProductBase):
    id: UUID
    current_cost_price: Decimal
    margin: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
