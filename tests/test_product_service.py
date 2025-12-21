from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import UnitOfMeasure
from app.schemas.product import ProductCreate
from app.services.products import ProductService


async def test_create_product(session: AsyncSession) -> None:
    payload = ProductCreate(
        name="Test Laddu",
        unit_of_measure=UnitOfMeasure.KG,
        sell_price=Decimal("500.00"),
        initial_cost_price=Decimal("300.00"),
        is_active=True,
    )

    product = await ProductService.create(session, payload)

    assert product.id is not None
    assert product.name == payload.name
    assert product.sell_price == payload.sell_price

    assert len(product.price_history) == 1
    assert product.price_history[0].cost_price == Decimal("300.00")
    assert product.current_cost_price == Decimal("300.00")


async def test_find_products_filtering(session: AsyncSession) -> None:
    # Seed Products
    await ProductService.create(
        session,
        ProductCreate(
            name="Active Laddu", sell_price=Decimal("100.00"), is_active=True
        ),
    )

    await ProductService.create(
        session,
        ProductCreate(
            name="Inactive Laddu", sell_price=Decimal("100.00"), is_active=False
        ),
    )

    results = await ProductService.find(session)
    assert len(results) == 1
    assert results[0].name == "Active Laddu"

    results_all = await ProductService.find(session, False)
    assert len(results_all) == 2


async def test_update_prices_creates_history(session: AsyncSession):
    # Seed Products
    product = await ProductService.create(
        session,
        ProductCreate(
            name="Volatility Laddu",
            sell_price=Decimal("100"),
            initial_cost_price=Decimal("50"),
        ),
    )

    # Update ONLY Sell Price (Should NOT create history)
    updated_p = await ProductService.update_prices(
        session, product_id=product.id, new_sell_price=Decimal("120")
    )
    assert updated_p.sell_price == Decimal("120")
    assert len(updated_p.price_history) == 1  # Still just the initial one

    # Update Cost Price (Should create history)
    updated_p_2 = await ProductService.update_prices(
        session, product_id=product.id, new_cost_price=Decimal("60")
    )

    assert len(updated_p_2.price_history) == 2
    assert updated_p_2.current_cost_price == Decimal("60")

    # Verify the history is ordered correctly (newest first)
    assert updated_p_2.price_history[0].cost_price == Decimal("60")
    assert updated_p_2.price_history[1].cost_price == Decimal("50")
