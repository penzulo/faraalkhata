from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Order, OrderCancellation, OrderItem, OrderPayment, OrderStatus
from app.schemas import CancellationCreate, OrderCreate, PaymentCreate
from app.services.product import ProductService  # NOTE: Imported explicitly


class OrderService:
    @staticmethod
    async def find_by_id(db: AsyncSession, order_id: UUID) -> Order | None:
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
    async def create(db: AsyncSession, data: OrderCreate) -> Order:
        """
        1. Validate Customer
        2. Creates Order
        3. Creates Items (fetching current prices)
        4. Deducts Stock
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
    async def cancel(
        db: AsyncSession, order_id: UUID, data: CancellationCreate
    ) -> Order:
        """
        Cancels order and RESTORES stock.
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

    @staticmethod
    async def log_payment(
        db: AsyncSession, order_id: UUID, data: PaymentCreate
    ) -> Order:
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
