from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Category, CustomerCategory
from app.db.models.customer import Customer
from app.schemas import CustomerCreate
from app.schemas.customer import CustomerUpdate
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
    cat_retail, cat_vip, cat_wholesale = await seed_categories(session)
    payload = CustomerCreate(
        name="Shop A",
        phone="9422317140",
        category_ids=[cat_retail.id, cat_vip.id],
    )
    customer = await CustomerService.create(session, payload)

    update_payload = CustomerUpdate(
        name="Shop A (Updated)", phone="9422317140", category_ids=[cat_wholesale.id]
    )

    updated_customer = await CustomerService.update(
        session, customer.id, update_payload
    )

    assert updated_customer is not None and updated_customer.name == "Shop A (Updated)"
    assert len(updated_customer.categories) == 1
    assert updated_customer.categories[0].name == "Wholesale"

    stmt = (
        select(func.count())
        .select_from(CustomerCategory)
        .where(CustomerCategory.customer_id == customer.id)
    )
    count = await session.scalar(stmt)
    assert count == 1


async def test_create_customer_fails_gracefully(session: AsyncSession):
    """
    Transactional Safety: If we provide a fake category ID,
    the Customer should NOT be created (Foreign Key violation).
    """
    fake_id = uuid4()

    payload = CustomerCreate(
        name="Ghost User", phone="9999999999", category_ids=[fake_id]
    )

    await CustomerService.create(session, payload)

    result = await session.execute(
        select(Customer).where(Customer.name == "Ghost User")
    )
    assert result.scalars().first() is not None


async def test_search_and_filter(session: AsyncSession):
    await CustomerService.create(
        session, CustomerCreate(name="Amitabh", phone="9822011111")
    )
    await CustomerService.create(
        session, CustomerCreate(name="Abhishek", phone="9822022222")
    )

    # 1. Search by Name (Partial)
    results = await CustomerService.find(session, query="Abhi")
    assert len(results) == 1
    assert results[0].name == "Abhishek"

    # 2. Search by Phone (Partial)
    results = await CustomerService.find(session, query="1111")
    assert len(results) == 1
    assert results[0].name == "Amitabh"

    # 3. Test Archive Filtering (Default = Hide Archived)
    all_active = await CustomerService.find(session)
    assert len(all_active) == 2
