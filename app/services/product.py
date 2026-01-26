from collections.abc import Sequence
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Product
from app.db.models.product import ProductPriceHistory
from app.schemas.product import ProductCreate


class ProductService:
    @staticmethod
    async def create(db: AsyncSession, data: ProductCreate) -> Product:
        """
        Create a new Product along with it's ProductPriceHistory.
        """
        new_product = Product(**data.model_dump(exclude={"initial_cost_price"}))
        db.add(new_product)
        await db.flush()

        initial_history = ProductPriceHistory(
            product_id=new_product.id, cost_price=data.initial_cost_price
        )
        db.add(initial_history)
        await db.flush()

        query = (
            select(Product)
            .where(Product.id == new_product.id)
            .options(selectinload(Product.price_history))
        )
        result = await db.execute(query)
        return result.scalar_one()

    @staticmethod
    async def find(db: AsyncSession, active_only: bool = True) -> Sequence[Product]:
        """
        Query all the products, active or inactive, from the database.
        """
        query = select(Product).options(selectinload(Product.price_history))
        if active_only:
            query = query.where(Product.is_active)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def find_by_id(db: AsyncSession, product_id: UUID) -> Product | None:
        """
        Find a Product in the database using it's id.
        """
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.price_history))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_prices(
        db: AsyncSession,
        product_id: UUID,
        new_sell: Decimal | None = None,
        new_cost: Decimal | None = None,
    ):
        """
        Update the cost price, sell price or both prices of a Product
        ensuring ProductPriceHistory gets updated accordingly, if need be.
        """
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.price_history))
        )
        result = await db.execute(query)
        product = result.scalars().first()

        if not product:
            raise NoResultFound(f"Product of id: {product_id} not found.")

        if new_sell is not None:
            product.sell_price = new_sell

        if new_cost is not None:
            current_cost = product.current_cost_price

            if new_cost != current_cost:
                new_history = ProductPriceHistory(
                    product_id=product.id, cost_price=new_cost
                )
                db.add(new_history)

        await db.flush()
        await db.refresh(product)

        result = await db.execute(query)
        return result.scalar_one()

    @staticmethod
    async def archive(db: AsyncSession, product_id: UUID) -> Product:
        """
        Mark a product as not active in the database to prevent future use.
        """
        product = await db.get(Product, product_id)
        if not product:
            raise NoResultFound(f"Product of id: {product_id} not found.")

        product.is_active = False
        db.add(product)
        await db.flush()
        await db.refresh(product)
        return product

    @staticmethod
    async def delete(db: AsyncSession, product_id: UUID) -> None:
        """
        Hard-delete a product from the database only if it is not linked to
        any orders.
        """
        # WARN: Only allow a hard delete when no Orders are linked.
        # TODO: Add logic for checking links with Orders
        product = await db.get(Product, product_id)
        if not product:
            raise NoResultFound(f"Product of id: {product_id} not found.")

        await db.delete(product)
        await db.flush()

    @staticmethod
    async def adjust_stock(
        db: AsyncSession,
        product_id: UUID,
        quantity_delta: Decimal,
        allow_negative: bool = True,
    ) -> Product:
        """
        Safely adjusts stock by locking the database row.

        Args:
            quantity_delta: Positive to add stock, Negative to remove stock.
            allow_negative: If False, raises error if stock drops below 0.
        """
        query = select(Product).where(Product.id == product_id).with_for_update()
        product = (await db.execute(query)).scalar_one_or_none()

        if not product:
            raise ValueError(f"Product {product_id} not found.")

        new_stock = product.current_stock + quantity_delta

        if not allow_negative and new_stock < 0:
            raise ValueError(
                f"Insufficient stock for {product.name}. "
                + f"Current: {product.current_stock}, Requested: {abs(quantity_delta)}"
            )

        product.current_stock = new_stock

        db.add(product)
        await db.flush()
        await db.refresh(product)
        return product
