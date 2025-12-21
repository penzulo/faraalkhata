# Faraal Khata 🥨📝

> A simplified, robust Order Management System for seasonal Faraal (snack) businesses.

**Faraal Khata** is a purpose-built application designed to manage the intense rush of festive orders (Diwali, Ganesh Chaturthi, etc.) with minimal friction. Originally a React SPA, this project has been migrated to a **server-driven architecture** to prioritize stability, speed, and ease of maintenance during the off-season.

## 🎯 Project Philosophy

Seasonal businesses have unique constraints:

1.  **High Intensity, Short Duration:** The app must be rock-solid for 2-3 weeks of the year.
2.  **Low Maintenance:** It sits dormant for months; it should "just work" when spun up again without complex build pipelines.
3.  **Speed over Style:** The "Digital Menu" interface is designed for rapid order entry by staff/family, not for e-commerce browsing.

## 🛠 Tech Stack

We utilize the "Modern Python Monolith" stack to keep logic centralized and complexity low.

* **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+) - High-performance async API & server.
* **Templating:** [Jinja2](https://jinja.palletsprojects.com/) - Server-side HTML rendering.
* **Interactivity:** [HTMX](https://htmx.org/) - Swaps HTML partials for a dynamic feel without writing JavaScript.
* **Client State:** [Alpine.js](https://alpinejs.dev/) - For micro-interactions (counters, toggles) that don't need a server round-trip.
* **Database:** [SQLite](https://www.sqlite.org/) - Small, fast, self-contained SQL database engine.
* **ORM:** [SQLAlchemy (Async)](https://www.sqlalchemy.org/) - Robust database abstraction.
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling.

## ✨ Key Features

* **⚡ Rapid Order Entry (POS Mode):** A "Digital Menu" interface allowing users to input quantities for multiple items and generate a quote instantly.
* **📦 Product Management:**
    * Support for various units (kg, dozen, pieces, box).
    * **Price History:** Tracks cost price fluctuations over time for margin analysis.
    * Stock management with automatic deductions.
* **👥 Customer Management:** Quick-search and link customers to orders.
* **🧾 Quote vs. Order:** Instantly calculate totals for inquiries ("Sample Orders") without cluttering the database, or convert them to confirmed orders.
* **🔌 API-First Design:** The core service layer is decoupled from the UI, allowing a future mobile app to connect to the same backend via JSON endpoints.

## 🚀 Getting Started

### Prerequisites
* [uv](https://docs.astral.sh/uv/)
* [Python](https://www.python.org/) 3.11+

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/penzulo/faraalkhata.git
cd faraalkhata
```

2. **Set up Virtual Environment:**
```bash
uv sync
```

3. **Run Migrations**
```bash
uv run alembic upgrade head
```

#### Running the App
Start the hot-reloading development server:
```bash
uvicorn app.main:app --reload
```
Visit `http://localhost:8000` to access the application.

## 🧪 Testing
We use `pytest` with `aiosqlite` for fast, asynchronous unit tests of the API and the Service layer.
```bash
# Run all tests
pytest

# Run tests with verbose output
pytest -v
```

## 🗺  Roadmap
- [ ] **Auth Layer:** Implement JWT via HTTP-Only cookies for multi-user auditing.
- [ ] **Reporting:** Generate PDF invoices and "Daily Prep" lists for the kitchen.
- [ ] **WhatsApp Integration:** Send order confirmations directly to customers via WhatsApp API.
