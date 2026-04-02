# NutriStore — E-commerce App (React + Supabase)

A full-featured e-commerce web app for selling products (with multiple sizes in grams), managing blogs, and moderating customer reviews.

---

## 🗂 Project Structure

```
ecommerce/
├── src/
│   ├── lib/
│   │   └── supabase.js              # Supabase client
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── admin/
│   │       ├── AdminLayout.jsx      # Sidebar layout
│   │       ├── ProductForm.jsx      # Add/Edit product modal
│   │       ├── StockManager.jsx     # Adjust stock per size
│   │       └── BlogForm.jsx         # Add/Edit blog post modal
│   └── pages/
│       ├── store/
│       │   ├── Home.jsx             # Landing page
│       │   ├── ProductsPage.jsx     # Product listing
│       │   ├── ProductDetail.jsx    # Product + reviews
│       │   ├── BlogsPage.jsx        # Blog listing
│       │   └── BlogDetail.jsx       # Blog post
│       └── admin/
│           ├── AdminLogin.jsx
│           ├── AdminDashboard.jsx   # Stats + low stock alerts
│           ├── AdminProducts.jsx    # CRUD + stock management
│           ├── AdminBlogs.jsx       # CRUD blogs
│           └── AdminReviews.jsx     # Approve/delete reviews
├── supabase-schema.sql              # Full DB schema + seed data
├── .env.example
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. This creates 4 tables: `products`, `product_sizes`, `blogs`, `reviews`

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in your values from the Supabase project dashboard (Settings → API):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create an Admin User

In your Supabase dashboard → **Authentication → Users → Add User**:
- Enter your email and password
- This user will be able to log in to `/admin`

### 4. Install & Run

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## 📦 Database Schema

### `products`
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | Product name |
| description | TEXT | Full description |
| price | NUMERIC | Base price |
| category | TEXT | e.g. "Nuts", "Mixes" |
| image_url | TEXT | Product image URL |
| is_active | BOOLEAN | Visible on store? |

### `product_sizes`
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| product_id | UUID | FK → products |
| size_grams | INTEGER | e.g. 100, 250, 500 |
| price_override | NUMERIC | Optional size-specific price |
| stock_quantity | INTEGER | Current stock |
| sku | TEXT | Optional SKU code |

### `blogs`
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| title | TEXT | Blog title |
| slug | TEXT | URL-friendly identifier |
| content | TEXT | Full content (plain text / Markdown) |
| excerpt | TEXT | Short summary |
| author | TEXT | Author name |
| cover_image_url | TEXT | Cover image |
| is_published | BOOLEAN | Live on site? |

### `reviews`
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| product_id | UUID | FK → products |
| customer_name | TEXT | Reviewer name |
| customer_email | TEXT | Optional email |
| rating | INTEGER | 1–5 stars |
| comment | TEXT | Review text |
| is_approved | BOOLEAN | Moderated by admin |

---

## 🔗 Routes

### Store (Public)
| Route | Page |
|---|---|
| `/` | Home — hero, products, reviews, blogs |
| `/products` | All products with category filter |
| `/products/:id` | Product detail + size picker + reviews |
| `/blogs` | Blog listing |
| `/blogs/:slug` | Blog post detail |

### Admin (Login required)
| Route | Page |
|---|---|
| `/admin/login` | Login with Supabase Auth |
| `/admin` | Dashboard — stats + low stock alerts |
| `/admin/products` | Add, edit, delete products; manage stock per size |
| `/admin/blogs` | Add, edit, publish/unpublish, delete posts |
| `/admin/reviews` | Approve or delete customer reviews |

---

## 🛠 Built With

- **React 18** + **React Router v6**
- **Supabase** — Postgres DB + Auth + Row Level Security
- **Tailwind CSS** — utility-first styling
- **Lucide React** — icons
- **React Hot Toast** — notifications
- **Vite** — build tool

---

## 🔒 Security

- Row Level Security (RLS) is enabled on all tables
- Public users can only READ active products, published blogs, approved reviews
- Public users can INSERT new reviews (pending approval)
- All write/update/delete operations require authentication
- Admin login is handled by Supabase Auth (email + password)
