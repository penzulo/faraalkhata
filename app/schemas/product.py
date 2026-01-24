from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    unit_of_measure: str = Field(default="kg")
    sell_price: Decimal = Field(ge=0)
    current_stock: Decimal = Field(default=Decimal(0))
    is_active: bool = True

    @field_validator("unit_of_measure")
    @classmethod
    def validate_uom(cls, v: str) -> str:
        allowed = ["kg", "gram", "piece", "dozen", "box", "liter"]
        if v.lower() not in allowed:
            raise ValueError(f"Unit must be one of {allowed}")
        return v.lower()


class ProductCreate(ProductBase):
    initial_cost_price: Decimal = Field(default=Decimal(0), ge=Decimal(0))


class ProductUpdate(BaseModel):
    """
    Used for 'Update Prices'.
    EXCLUDES prices and stock to prevent accidental financial data corruption.
    """

    name: str | None = Field(default=None, min_length=2)
    unit_of_measure: str | None = None
    category: str | None = None
    is_active: bool | None = None


class ProductPriceUpdate(BaseModel):
    """
    Used for 'Update Prices' action.
    Triggers the history tracking logic in the Service Layer.
    """

    new_sell_price: Decimal | None = Field(default=None, ge=0)
    new_cost_price: Decimal | None = Field(default=None, ge=0)


class ProductStockAdjust(BaseModel):
    """
    Used for 'Add Stock' or 'Record Waste'.
    """

    adjustment: Decimal = Field(
        description="Positive to add stock, Negative to remove (sale/waste)"
    )
    reason: str | None = Field(default=None, description="E.g., 'New Batch', 'Expired'")


class ProductResponse(ProductBase):
    id: UUID
    current_cost_price: Decimal
    margin: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
