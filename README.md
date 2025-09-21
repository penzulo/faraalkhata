# FaraalKhata 🥨

A simple, powerful Progressive Web App (PWA) to manage a seasonal *faraal* business with zero hassle. This is the single source of truth for all orders, inventory, and payments.

-----

##  The Problem

Running a seasonal, dropshipping-style business for Diwali *faraal* using a physical diary and inconsistent spreadsheets is inefficient and risky. It leads to lost orders, forgotten payments, zero visibility into "cache" inventory, and ultimately, unaccounted financial losses. This tool solves that.

-----

##  ✨ Core Features

  * ✅ **Real-Time Dashboard:** At-a-glance view of revenue, profit, and outstanding payments.
  * ✅ **Comprehensive Order Management:** A full lifecycle system to create, edit, track, and manage customer orders.
  * ✅ **Smart Inventory Tracking:** Automatically calculates on-hand "cache" inventory by tracking purchases from suppliers and sales to customers. Includes spoilage write-offs.
  * ✅ **Dual-Direction Financial Ledger:** Meticulously tracks every rupee coming in from customers and going out to suppliers.
  * ✅ **Insightful Reporting:** Generate reports on top-selling products, top customers, and overall profitability for any date range.
  * ✅ **Full Audit Trail:** Every important action is logged, providing a complete history of who did what and when.

-----

##  🛠️ Tech Stack & Architecture

This project uses a modern, scalable, and cost-effective tech stack. The architecture is a simple client-server model with the frontend hosted on Netlify and the backend managed by Supabase.

| Component            | Technology                                           |
| -------------------- | ---------------------------------------------------- |
| **Frontend** | ⚛️ React (with Vite) & TypeScript                     |
| **Routing** | 🧭 TanStack Router (File-based)                        |
| **Data Fetching** | 🔄 TanStack Query (Server State Management)            |
| **Forms** | 📝 TanStack Form                                       |
| **UI Components** | 🎨 Shadcn/UI & Tailwind CSS                            |
| **Backend** | **Supabase** (Auth, Postgres, APIs)         |
| **Database** | 🐘 PostgreSQL                                        |
| **Deployment** | 🚀 Netlify                                           |

-----

##  🚀 Getting Started

Follow these instructions to get a local copy up and running for development.

### **Prerequisites**

  * Node.js (v18 or later) or Bun
  * npm
  * Docker (must be running)
  * Supabase Account (for project linking)

### **Local Setup**

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/penzulo/faraalkhata.git
    cd faraalkhata
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Set up Supabase CLI and link your project:**

    ```bash
    # Install the CLI globally or use bunx
    bun install -g supabase

    # Login to your account
    supabase login

    # Link to your remote Supabase project (get the ref from project settings)
    supabase link --project-ref <project-ref>
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project and copy the contents of `.env.example`. Fill in your Supabase URL and `anon` key.

    ```env
    VITE_SUPABASE_URL="SUPABASE_URL"
    VITE_SUPABASE_ANON_KEY="SUPABASE_ANON_KEY"
    ```

5.  **Start the local backend:**
    This will spin up a local Docker container for your Supabase instance.

    ```bash
    supabase start
    ```

6.  **Apply database migrations:**
    This will wipe your local database and apply all migrations from the `supabase/migrations` folder to set up your schema.

    ```bash
    supabase db reset
    ```

7.  **Run the frontend development server:**

    ```bash
    bun --bun run dev
    ```

    Your application should now be running on `http://localhost:5173`.

-----

##  🗄️ Database Migrations Workflow

All database schema changes are managed via the Supabase CLI. **Never make changes directly to the remote database via the Supabase Studio.**

1.  **Make Changes Locally:** Use the local Supabase Studio (URL provided when you run `supabase start`) to edit tables or run SQL.
2.  **Generate a New Migration:** After making your changes, generate a new migration file.
    ```bash
    supabase db diff -f "a_descriptive_migration_name"
    ```
3.  **Push to Production:** Apply the new migration to your live Supabase project.
    ```bash
    supabase db push
    ```

-----

##  🗺️ Project Roadmap

  * [ ] Implement TanStack DB for full offline support.
  * [ ] Add advanced filtering and date-range presets to reports.
  * [ ] Set up automated notifications for overdue payments.
  * [ ] Build a simple settings page for managing users and products.

-----

##  📜 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
