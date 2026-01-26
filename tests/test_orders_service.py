from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Customer, OrderStatus, Product
from app.schemas import CustomerCreate, OrderCreate, OrderItemCreate, ProductCreate
from app.schemas.order import CancellationCreate
from app.services import CustomerService, OrderService, ProductService


async def create_setup_data(db: AsyncSession) -> tuple[Customer, Product]:
    """
    Creates a customer and a product with known stock.
    """
    customer = await CustomerService.create(
        db, CustomerCreate(name="Test Customer", phone="9998887777")
    )

    product = await ProductService.create(
        db,
        ProductCreate(
            name="Test Laddu",
            sell_price=Decimal("50.00"),
            current_stock=Decimal("100.00"),
            initial_cost_price=Decimal("30.00"),
        ),
    )

    return customer, product


async def test_create_order_deducts_stock(session: AsyncSession):
    customer, product = await create_setup_data(session)

    payload = OrderCreate(
        customer_id=customer.id,
        due_date=date(2026, 2, 14),
        items=[OrderItemCreate(product_id=product.id, quantity=Decimal("10"))],
    )

    order = await OrderService.create(session, payload)

    assert order.status == OrderStatus.PENDING
    assert order.total_amount == Decimal("500.00")
    assert len(order.items) == 1

    updated_product = await ProductService.find_by_id(session, product.id)
    assert updated_product is not None and updated_product.current_stock == Decimal(
        "90.00"
    )


async def test_cancel_order_restores_stock(session: AsyncSession):
    customer, product = await create_setup_data(session)
    payload = OrderCreate(
        customer_id=customer.id,
        due_date=date(2026, 2, 14),
        items=[OrderItemCreate(product_id=product.id, quantity=Decimal("20"))],
    )
    order = await OrderService.create(session, payload)

    p_after_order = await ProductService.find_by_id(session, product.id)
    assert p_after_order is not None and p_after_order.current_stock == Decimal("80.00")

    cancel_payload = CancellationCreate(reason="Customer changed mind.")
    cancelled_order = await OrderService.cancel(session, order.id, cancel_payload)

    assert cancelled_order.status == OrderStatus.CANCELLED

    p_after_cancel = await ProductService.find_by_id(session, product.id)
    assert p_after_cancel is not None and p_after_cancel.current_stock == Decimal(
        "100.00"
    )  # Back to original

    assert (
        cancelled_order is not None
        and cancelled_order.cancellation.reason == "Customer changed mind."
    )


async def test_create_order_fails_invalid_product(session: AsyncSession):
    customer, _ = await create_setup_data(session)
    fake_product_id = uuid4()

    payload = OrderCreate(
        customer_id=customer.id,
        due_date=date(2026, 2, 14),
        items=[OrderItemCreate(product_id=fake_product_id, quantity=Decimal("1"))],
    )

    with pytest.raises(ValueError) as exc:
        await OrderService.create(session, payload)

    assert "not found" in str(exc.value)


async def test_create_order_multiple_items(session: AsyncSession):
    customer = await CustomerService.create(
        session, CustomerCreate(name="Big Eater", phone="9999999999")
    )

    p1 = await ProductService.create(
        session,
        ProductCreate(
            name="Laddu", sell_price=Decimal("100"), current_stock=Decimal("50")
        ),
    )
    p2 = await ProductService.create(
        session,
        ProductCreate(
            name="Chivda", sell_price=Decimal("200"), current_stock=Decimal("50")
        ),
    )

    payload = OrderCreate(
        customer_id=customer.id,
        due_date=date(2026, 2, 14),
        discount_amount=Decimal("50.00"),
        items=[
            OrderItemCreate(product_id=p1.id, quantity=Decimal("2")),
            OrderItemCreate(product_id=p2.id, quantity=Decimal("1")),
        ],
    )

    order = await OrderService.create(session, payload)

    assert order.total_amount == Decimal("350.00")

    p1_new = await ProductService.find_by_id(session, p1.id)
    p2_new = await ProductService.find_by_id(session, p2.id)

    assert p1_new is not None and p1_new.current_stock == Decimal("48")
    assert p2_new is not None and p2_new.current_stock == Decimal("49")
