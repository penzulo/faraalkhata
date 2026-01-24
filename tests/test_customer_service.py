from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Category, CustomerCategory
from app.schemas import CustomerCreate
from app.services import CategoryService, CustomerService


async def seed_categories(session: AsyncSession) -> tuple[Category, ...]:
    cat1 = await CategoryService.create(session, "Retail")
    cat2 = await CategoryService.create(session, "VIP")
    cat3 = await CategoryService.create(session, "Wholesale")
    return cat1, cat2, cat3


async def test_create_customer_with_categories(session: AsyncSession) -> None:
    cat_retail, cat_vip, _ = await seed_categories(session)
    payload = CustomerCreate(
        name="Bhargav Deshpande",
        phone="9403018661",
        notes="Loves Spicy Chivda",
        category_ids=[cat_retail.id, cat_vip.id],
    )
    customer = await CustomerService.create(session, payload)

    assert customer.id is not None
    assert customer.name == "Bhargav Deshpande"

    assert len(customer.categories) == 2

    stmt = (
        select(func.count())
        .select_from(CustomerCategory)
        .where(CustomerCategory.customer_id == customer.id)
    )
    count = await session.scalar(stmt)
    assert count == 2


async def test_update_customer_replaces_categories(session: AsyncSession):
    """
    Test the 'Replace' logic.
    If we update from [Retail, VIP] -> [Wholesale], the old links must be gone.
    """
    cat_retail, cat_vip, cat_wholesage = await seed_categories(session)
    payload = CustomerCreate(
        name="Shop A", phone="9422317140", category_ids=[cat_retail.id, cat_vip.id]
    )
    customer = await CustomerService.create(session, payload)
