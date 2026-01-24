from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CustomerCategoryEnum(StrEnum):
    RETAIL = "Retail"  # Standard Customers buying for personal consumption.
    WHOLESALE = "Wholesale"  # Shops or resellers buying in bulk.
    CORPORATE = "Corporate"  # Companies buying gift boxes for employees.
    FAMILY_FRIENDS = "Family & Friends"  # Relatives and close friends.
    VIP = "VIP"  # Customers (loyalty) who order large amounts every single year.


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    customers: Mapped[list["Customer"]] = relationship(
        secondary="customer_categories", back_populates="categories", viewonly=True
    )


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(
        String(40), nullable=True, unique=True, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    categories: Mapped[list["Category"]] = relationship(
        secondary="customer_categories", back_populates="customers", lazy="selectin"
    )


class CustomerCategory(Base):
    __tablename__ = "customer_categories"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4
    )
    customer_id: Mapped[UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE")
    )
    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "customer_id", "category_id", name="uq_customer_category_pair"
        ),
    )
