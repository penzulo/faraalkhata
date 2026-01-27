import warnings
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
    """
    Service layer for Product domain layer.

    Handles product lifecycle management, pricing updates with history tracking,
    stock adjustments, and retrieval operations.
    """

    @staticmethod
    async def find(db: AsyncSession, active_only: bool = True) -> Sequence[Product]:
        """
        Retrieve all products, optionall filtering only active ones.

        Price history is eagerly loaded.
        """
        query = select(Product).options(selectinload(Product.price_history))
        if active_only:
            query = query.where(Product.is_active)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def find_by_id(db: AsyncSession, product_id: UUID) -> Product | None:
        """
        Fetch a product by ID with its price history loaded.

        Returns `None` if the product does not exist.
        """
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.price_history))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_low_stock(db: AsyncSession, threshold: int = 10) -> Sequence[Product]:
        """
        Retrieve active products with stock at of below the given threshold.

        Results are ordered by lowest stock first.
        Intended for inventory alerts and dashboard indicators.
        """
        query = (
            select(Product)
            .where(Product.is_active == True)  # noqa: E712
            .where(Product.current_stock <= threshold)
            .order_by(Product.current_stock.asc())
        )
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, data: ProductCreate) -> Product:
        """
        Create a new product and initialize its price history.

        Persists the product and records the initial cost price
        in `ProductPriceHistory`.
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
    async def update_prices(
        db: AsyncSession,
        product_id: UUID,
        new_sell: Decimal | None = None,
        new_cost: Decimal | None = None,
    ):
        """
        Update product pricing and append to cost price history if changed.

        Raises:
            `NoResultFound`: If the product does not exist.
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
        Archive a product by marking it inactive.

        Archived products are excluded from future use.
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
        Hard-delete a product if it is not linked to any orders.

        Raises:
            `NoResultFound`: If the product does not exist.
            `NotImplementedError`: Hard delete safety check.
        """
        warnings.warn(
            "Hard delete without order check is unsafe.",
            category=UserWarning,
            stacklevel=2,
        )
        product = await db.get(Product, product_id)
        if not product:
            raise NoResultFound(f"Product of id: {product_id} not found.")

        raise NotImplementedError(
            "Hard delete safety check missing. "
            + "Must verify product is not linked to orders."
        )

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
        Adjust product stock safely using row-level locking.

        Args:
            `quantity_delta`: Positive to add stock, negative to deduct stock.
            `allow_negative`: If `False`, prevents stock from dropping below 0.

        Raises:
            `ValueError`: If the product does not exist or stock is insufficient.
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
