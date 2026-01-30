import warnings
from typing import Any, TypeVar

from fastapi import HTTPException, Request, status
from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)


async def parse_form(request: Request, schema: type[T]) -> T:
    """
    Parses form data from the request and validates it against the
    Pydantic schema. Handles standard fields and basic list processing.

    Raises:
        `HTTPException`: If Pydantic validation fails.
    """
    form_data = await request.form()
    data: dict[str, Any] = {}

    for key, value in form_data.multi_items():
        if key in data:
            if isinstance(data[key], list):
                data[key].append(value)
            else:
                data[key] = value

    warnings.warn(
        "Re-rendering form with errors is NOT implemented.",
        category=UserWarning,
        stacklevel=2,
    )

    try:
        return schema(**data)
    except ValidationError as e:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail=e.errors()
        ) from e
