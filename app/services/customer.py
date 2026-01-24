from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import delete, func, insert, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Category, Customer, CustomerCategory
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerService:
    """
    Service Layer for Customer domaain logic.

    Handles customer retrieval, creation, updates, and category assignments,
    encapsulating all database interactions related to customers.
    """

    @staticmethod
    async def find(
        db: AsyncSession,
        query: str | None = None,
        show_archived: bool = False,
        sort_by: str = "name",
    ) -> Sequence[Customer]:
        """
        Retrieve customers with optional searchm archive filtering, and sorting.

        Suports case-insensitive search on name and phone, optional inclusion
        of archived customers, and sorting by name or creation date.
        """
        stmt = select(Customer).options(selectinload(Customer.categories))

        if not show_archived:
            stmt = stmt.where(Customer.is_archived == False)  # noqa: E712

        if query:
            search_term = f"{query}"
            stmt = stmt.where(
                or_(Customer.name.ilike(search_term), Customer.phone.ilike(search_term))
            )

        if sort_by == "created_at":
            stmt = stmt.order_by(Customer.created_at.desc())
        else:
            stmt = stmt.order_by(Customer.name.asc())

        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def find_by_id(db: AsyncSession, customer_id: UUID) -> Customer | None:
        """
        Fetches a single customer by ID with categories eagerly loaded.

        Returns None if the customer does not exist.
        """
        query = (
            select(Customer)
            .where(Customer.id == customer_id)
            .options(selectinload(Customer.categories))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, data: CustomerCreate) -> Customer:
        """
        Create a new customer and optionally assigne categories.

        The operation is transactional: if category assignment fails
        the customer is not persisted.
        """
        new_customer = Customer(
            name=data.name, phone=data.phone, notes=data.notes, is_archived=False
        )
        db.add(new_customer)
        await db.flush()

        if data.category_ids:
            await CustomerService._assign_categories(
                db, new_customer.id, data.category_ids
            )

        await db.commit()
        await db.refresh(new_customer, attribute_names=["categories"])
        return new_customer

    @staticmethod
    async def update(db: AsyncSession, customer_id: UUID, data: CustomerUpdate):
        """
        Update customer details and replace category assignments if provided.

        Raises:
            ValueError: If the customer does not exist.
        """
        customer = await CustomerService.find_by_id(db, customer_id)
        if not customer:
            raise ValueError("Customer not found.")

        if data.name:
            customer.name = data.name

        if data.phone:
            customer.phone = data.phone

        if data.notes is not None:
            customer.notes = data.notes

        if data.category_ids is not None:
            await db.execute(
                delete(CustomerCategory).where(
                    CustomerCategory.customer_id == customer_id
                )
            )

            await CustomerService._assign_categories(db, customer_id, data.category_ids)

            await db.commit()
            await db.refresh(customer, attribute_names=["categories"])
            return customer

    @staticmethod
    async def _assign_categories(
        db: AsyncSession, customer_id: UUID, category_ids: list[UUID]
    ) -> None:
        """
        Assign categories to a custeomr via bulk insert into the junction table.
        """
        if not category_ids:
            return

        mappings = [
            {"customer_id": customer_id, "category_id": cat_id}
            for cat_id in category_ids
        ]
        stmt = insert(CustomerCategory)
        await db.execute(stmt, mappings)


class CategoryService:
    """
    Service layer for Category domain logic.

    Handles category retrieval, creation, and aggregate statistics,
    independent of customer-specific operatoins.
    """

    @staticmethod
    async def find_all(db: AsyncSession) -> Sequence[Category]:
        """
        Retrieve all categories ordered alphabetically by name.
        """
        result = await db.execute(select(Category).order_by(Category.name))
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, name: str) -> Category:
        """
        Create and persist a new category.
        """
        new_cat = Category(name=name)
        db.add(new_cat)
        await db.flush()
        await db.refresh(new_cat)
        return new_cat

    @staticmethod
    async def get_stats(db: AsyncSession) -> dict[str, int]:
        """
        Return customer counts per category.

        Example:
            {'VIP': 5, 'Retail': 120}
        """
        query = (
            select(
                Category.name, func.count(CustomerCategory.customer_id).label("count")
            )
            .outerjoin(CustomerCategory, Category.id == CustomerCategory.category_id)
            .group_by(Category.name)
            .order_by(Category.name)
        )
        result = await db.execute(query)
        return {row.name: row.count for row in result.scalars().all()}
