# Copilot Instructions for Serial Subscription Tracking System

## Project Overview
- This is a Laravel + React (Vite) monorepo for a serial subscriptions tracking system.
- Backend: Laravel (PHP) in the root directory, with models in `app/Models`, controllers in `app/Http/Controllers`, and routes in `routes/`.
- Frontend: React components in `resources/js/Pages/`, with Vite for asset bundling.
- Database: Default is MySQL, but MongoDB support may be added (see `config/database.php`).

## Key Patterns & Structure
- **React Pages:** Each major UI page is a separate file in `resources/js/Pages/`. Sidebar navigation is handled via React Router (`react-router-dom`).
- **Sidebar Navigation:** Sidebar items use `<Link to={item.path}>` for routing. Update `sidebarItems` array to add or change navigation.
- **TopBar:** Common top bar UI is reused across pages for notifications, chat, and account menu.
- **Tables & Pagination:** Data tables are implemented with custom styles and manual pagination logic in each page component.
- **Backend API:** Laravel controllers (in `app/Http/Controllers/`) expose endpoints for frontend consumption. Data flow is typically RESTful.
- **Environment:** Use `.env` for environment variables. Switch DB by changing `DB_CONNECTION` in `.env` and updating `config/database.php`.

## Developer Workflows
- **Install dependencies:**
  - PHP: `composer install`
  - JS: `npm install`
- **Run locally:**
  - Backend: `php artisan serve`
  - Frontend: `npm run dev`
- **Migrate DB:** `php artisan migrate`
- **Testing:**
  - PHP: `php artisan test` or `vendor/bin/phpunit`
  - JS: No default JS test setup; add as needed.
- **Git Branching:**
  - Use feature branches for new pages/features (e.g., `Dashboard_Supplier`).
  - Push only your branch unless merging to `main`.

## Conventions & Tips
- **Component Naming:** Use PascalCase for React components and filenames.
- **Styling:** Inline styles are common in React pages; Tailwind is available via `tailwind.config.js`.
- **API Integration:** Use Axios or Fetch for API calls; endpoints are defined in Laravel routes/controllers.
- **No default API versioning.**
- **No Redux or global state; use React local state/hooks.**
- **No TypeScript by default.**

## Key Files & Directories
- `app/Http/Controllers/` — Laravel backend controllers
- `resources/js/Pages/` — React page components
- `routes/web.php` — Laravel web routes
- `config/database.php` — DB config (MySQL/MongoDB)
- `.env` — Environment variables
- `README.md` — Laravel generic info (see this file for project-specific details)

## Example: Adding a New Page
1. Create a new React file in `resources/js/Pages/` (e.g., `Dashboard_Supplier_Late.jsx`).
2. Add a route in your main React Router setup.
3. Add a sidebar item in `sidebarItems` with the correct `path`.
4. Implement backend API/controller as needed.

---
If anything is unclear or missing, please provide feedback to improve these instructions.
