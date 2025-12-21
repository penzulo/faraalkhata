from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Self
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UnitOfMeasure(StrEnum):
    KG = "kg"
    GRAM = "gram"
    PIECE = "piece"
    DOZEN = "dozen"
    BOX = "box"
    LITER = "liter"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(40), nullable=False)
    unit_of_measure: Mapped[UnitOfMeasure] = mapped_column(
        Enum(UnitOfMeasure, native_enum=False),
        default=UnitOfMeasure.KG,
        server_default="kg",
        nullable=False,
    )
    sell_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    current_stock: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    price_history = relationship(
        "ProductPriceHistory",
        back_populates="product",
        order_by="desc(ProductPriceHistory.effective_from_date)",
        lazy="select",
    )

    @property
    def current_cost_price(self: Self) -> Decimal:
        """
        Fetches the latest cost price from history or returns 0.
        """
        if self.price_history:
            return self.price_history[0].cost_price
        return Decimal(0)

    @property
    def margin(self: Self) -> Decimal:
        """
        Derived field: Profit per unit.
        """
        return Decimal(self.sell_price) - Decimal(self.current_cost_price or 0)


class ProductPriceHistory(Base):
    __tablename__ = "product_price_history"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4
    )
    product_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    cost_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    effective_from_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    product = relationship("Product", back_populates="price_history")
