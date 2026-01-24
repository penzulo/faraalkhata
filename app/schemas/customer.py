from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CustomerBase(BaseModel):
    name: str = Field(min_length=2)
    phone: str
    notes: str | None = None

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        """
        Sanitizes input: removes spaces/dashes, validates Indian format.
        """
        cleaned = "".join(filter(str.isdigit, v))
        if not (len(cleaned) == 10 and cleaned[0] in "6789"):
            raise ValueError("Invalid Indian phone number.")
        return cleaned


class CustomerCreate(CustomerBase):
    category_ids: list[UUID] = []


class CustomerUpdate(CustomerBase):
    category_ids: list[UUID] | None = None


class CategoryCreate(BaseModel):
    name: str


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    model_config = ConfigDict(from_attributes=True)


class CustomerResponse(CustomerBase):
    id: UUID
    is_archived: bool
    created_at: datetime
    categories: list[CategoryResponse] = []
    model_config = ConfigDict(from_attributes=True)
