from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import OrderStatus, PaymentMethod
from app.schemas import CustomerResponse

if TYPE_CHECKING:
    from app.schemas import ProductResponse


# NOTE: Fixed a typo
class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(gt=Decimal(0))


class OrderItemResponse(BaseModel):
    id: UUID
    product: "ProductResponse"
    quantity: Decimal
    price_at_time: Decimal
    total: Decimal


class PaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    method: PaymentMethod
    notes: str | None = None
    payment_data: date = Field(default_factory=date.today)


class CancellationCreate(BaseModel):
    reason: str
    notes: str | None = None


class OrderBase(BaseModel):
    customer_id: UUID
    delivery_address_id: UUID | None = None
    discount_amount: Decimal = Field(default=Decimal(0), ge=Decimal(0))
    delivery_fee: Decimal = Field(default=Decimal(0), ge=Decimal(0))
    due_date: date
    notes: str | None = None


class OrderCreate(OrderBase):
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderUpdate(OrderBase):
    """
    Used for editing an order (replacing items)
    """

    items: list[OrderItemCreate] = Field(min_length=1)


class OrderResponse(OrderBase):
    id: UUID
    display_id: str
    status: OrderStatus
    total_amount: Decimal
    created_at: datetime

    # Relationships
    customer: CustomerResponse
    items: list[OrderItemResponse]
    payments: list[PaymentCreate]

    # Computedd Fields
    paid_amount: Decimal
    balance_due: Decimal

    model_config = ConfigDict(from_attributes=True)
