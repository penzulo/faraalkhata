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
    async def find(db: AsyncSession, active_only: bool = True):
        query = select(Product).options(selectinload(Product.price_history))
        if active_only:
            query = query.where(Product.is_active)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, data: ProductCreate) -> Product:
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
        new_sell_price: Decimal | None = None,
        new_cost_price: Decimal | None = None,
    ):
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.price_history))
        )
        result = await db.execute(query)
        product = result.scalars().first()

        if not product:
            raise NoResultFound(f"Product of id: {product_id} not found.")

        if new_sell_price is not None:
            product.sell_price = new_sell_price

        if new_cost_price is not None:
            current_cost = product.current_cost_price

            if new_cost_price != current_cost:
                new_history = ProductPriceHistory(
                    product_id=product.id, cost_price=new_cost_price
                )
                db.add(new_history)

        await db.flush()
        return product
