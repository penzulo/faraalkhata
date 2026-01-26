from collections.abc import Sequence
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import (
    Customer,
    Order,
    OrderCancellation,
    OrderItem,
    OrderPayment,
    OrderStatus,
)
from app.schemas import CancellationCreate, OrderCreate, PaymentCreate
from app.services.product import ProductService


class OrderService:
    """
    Service layer for Order domain logic.

    Handles order retrieval, creation, cancellation, and payment tracking,
    including stock adjustments and status transitions.
    """

    @staticmethod
    async def find(
        db: AsyncSession,
        status: OrderStatus | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        search_query: str | None = None,
    ) -> Sequence[Order]:
        """
        Retrieve orders with optional status, date range, and search filters.

        Supports searching by order display ID or customer name.
        Results are ordered by most recent first.
        """
        query = (
            select(Order)
            .options(selectinload(Order.customer))
            .order_by(Order.created_at.desc())
        )

        if status:
            query = query.where(Order.status == status)
        if date_from:
            query = query.where(func.date(Order.created_at) >= date_from)
        if date_to:
            query = query.where(func.date(Order.created_at) <= date_to)
        if search_query:
            query = query.join(Order.customer).where(
                or_(
                    Order.display_id.ilike(f"{search_query}"),
                    Customer.name.ilike(f"{search_query}"),
                )
            )

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def find_by_id(db: AsyncSession, order_id: UUID) -> Order | None:
        """
        Fetch a single order by ID with all related entities eagerly loaded.

        Includes items, products, payments, customer, and delivery address.
        Returns None if the order does not exist.
        """
        query = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.payments),
                selectinload(Order.customer),
                selectinload(Order.delivery_address),
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict[str, int]:
        """
        Return order counts grouped by status.

        Keys are status values, values are total order counts.
        Intended for dashboard and reporting use.
        """
        query = select(Order.status, func.count(Order.id).label("total")).group_by(
            Order.status
        )
        result = await db.execute(query)
        return {row.status.value: row.total for row in result.all()}

    @staticmethod
    async def create(db: AsyncSession, data: OrderCreate) -> Order:
        """
        Create a new order with items and compute final pricing.

        Workflow:
        1. Validate customer and products
        2. Create order and line items (capturing current prices)
        3. Deduct product stock
        4. Calculate and persist total amount
        """
        new_order = Order(
            customer_id=data.customer_id,
            delivery_address_id=data.delivery_address_id,
            due_date=data.due_date,
            notes=data.notes,
            discount_amount=data.discount_amount,
            delivery_fee=data.delivery_fee,
            status=OrderStatus.PENDING,
            total_amount=Decimal(0),
        )
        db.add(new_order)
        await db.flush()

        subtotal = Decimal(0)
        for item_data in data.items:
            product = await ProductService.find_by_id(db, item_data.product_id)
            if not product:
                raise ValueError(f"Product {item_data.product_id} not found.")

            line_item = OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                quantity=item_data.quantity,
                price_at_time=product.sell_price,
                cost_price_at_time=product.current_cost_price,
            )
            db.add(line_item)

            subtotal += product.sell_price * item_data.quantity
            await ProductService.adjust_stock(db, product.id, -item_data.quantity)

        new_order.total_amount = subtotal - data.discount_amount + data.delivery_fee

        await db.flush()
        await db.refresh(new_order)
        return new_order

    @staticmethod
    async def log_payment(
        db: AsyncSession, order_id: UUID, data: PaymentCreate
    ) -> Order:
        """
        Record a payment against an order and update status if fully paid.

        Marks the order as COMPLETED if total payments meet or exceed
        the total amount and the order is READY.
        """
        order = await OrderService.find_by_id(db, order_id)
        if not order:
            raise ValueError("Order not found")

        payment = OrderPayment(
            order_id=order.id,
            amount=data.amount,
            method=data.method,
            notes=data.notes,
            payment_date=data.payment_data,
        )
        db.add(payment)
        await db.flush()

        await db.refresh(order, attribute_names=["payments"])

        total_paid = sum(p.amount for p in order.payments)
        if total_paid >= order.total_amount and order.status == OrderStatus.READY:
            order.status = OrderStatus.COMPLETED

        await db.flush()
        await db.refresh(order)
        return order

    @staticmethod
    async def cancel(
        db: AsyncSession, order_id: UUID, data: CancellationCreate
    ) -> Order:
        """
        Cancel an order, restore stock, and record cancellation details.

        Raises:
            ValueError: If the order does not exist or is already cancelled.
        """
        order = await OrderService.find_by_id(db, order_id)
        if not order:
            raise ValueError("Order not found")
        if order.status == OrderStatus.CANCELLED:
            raise ValueError("Already cancelled.")

        for item in order.items:
            await ProductService.adjust_stock(db, item.product_id, item.quantity)

        order.status = OrderStatus.CANCELLED

        cancellation = OrderCancellation(
            order_id=order.id, reason=data.reason, notes=data.notes
        )
        db.add(cancellation)

        await db.flush()
        await db.refresh(order)
        return order
