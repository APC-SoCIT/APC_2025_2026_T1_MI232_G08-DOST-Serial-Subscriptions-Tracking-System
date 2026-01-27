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
# Copilot Instructions

This is a **Laravel 12 + React (Inertia.js)** serial subscriptions tracking system for DOST. The frontend uses React 18 with Tailwind CSS, while the backend uses Eloquent ORM and Laravel Sanctum for authentication.

## Architecture Overview

### Full-Stack Integration: Laravel + Inertia.js + React
- **Backend**: Laravel 12 (routes in `routes/web.php`, controllers in `app/Http/Controllers/`)
- **Frontend**: React 18 components rendered server-side via Inertia.js (pages in `resources/js/Pages/`)
- **Styling**: Tailwind CSS 3.2 with custom theme in `tailwind.config.js`
- **Build Tool**: Vite 7 (configured in `vite.config.js`)
- **Database**: SQLite by default (dev), configurable to MySQL via `.env`

### Page Structure
- Dashboard routes return `Inertia::render('PageName')` from `routes/web.php`
- Corresponding React components auto-resolve from `resources/js/Pages/PageName.jsx` via Vite glob patterns
- Multiple dashboards for different roles (TPU, GSPS) use naming convention: `Dashboard_[ROLE]_[Feature].jsx`
- Auth forms use `GuestLayout` and authenticated pages use `AuthenticatedLayout`

### Data Flow
1. **Server → Client**: Route controller returns `Inertia::render()` with props
2. **Client → Server**: React components call API or form submissions via `usePage().props` and axios
3. **State**: Minimal frontend state; most data passed as props from server

## Key Workflows

### Development
```bash
# Terminal 1: Start Laravel dev server + queue listener + Pail logs
npm run dev

# Or separately:
php artisan serve              # Runs on http://localhost:8000
php artisan queue:listen       # Background jobs (for async tasks)
npm run dev                    # Vite HMR (hot reload for JSX/CSS)
```

### Testing
```bash
# Run all tests
composer test

# Or:
php artisan test              # Runs Feature + Unit tests defined in phpunit.xml
php artisan test tests/Feature/ExampleTest.php  # Single test file
```

### Database
```bash
php artisan migrate           # Run migrations (auto-discovers in database/migrations/)
php artisan migrate:fresh     # Reset + migrate
php artisan tinker            # REPL for quick DB queries/testing
```

### Build for Production
```bash
npm run build                 # Vite builds JS/CSS to public/build/
# App automatically serves built assets in production
```

## Code Patterns

### React Components & Props
- Pages receive props from server via `Inertia::render('PageName', ['data' => $value])`
- Components access props via `<Component data={props.data} />`
- Heavy use of `react-icons` (imported from `react-icons/go`, `react-icons/fa`, etc.)
- Inline styles mixed with Tailwind classes for custom colors/spacing

Example from `Dashboard_GSPS.jsx`:
```jsx
// Props from server passed directly to component
function GSPSDashboard() {
  const dashboardStats = [{ title: '...', value: '...' }];
  // Render using map, conditional styling, and icon components
}
```

### Auth & Routing
- Auth routes defined in `routes/auth.php` (managed by Laravel Breeze)
- Sanctum tokens for API authentication (`config/sanctum.php`)
- Middleware checks: `auth`, `verified` on protected routes
- User model in `app/Models/User.php` with standard Eloquent structure

### Styling
- Tailwind utility classes + custom theme colors (e.g., `#004A98`, `#28a745`)
- `@tailwindcss/forms` plugin for form styling
- Responsive layouts via Tailwind breakpoints (`sm:`, `md:`, `lg:`, etc.)

### Database Models
- Models in `app/Models/` extend `Authenticatable` (User) or `Model`
- Mass-assignment: define `$fillable` arrays
- Migrations define tables in `database/migrations/` (auto-discovered by Laravel)
- Current schema: `users`, `password_reset_tokens`, `sessions` (baseline)

## Integration Points

### External Dependencies
- **laravel/sanctum**: API token auth
- **laravel/breeze**: Auth scaffolding (login, register, password reset)
- **inertiajs/react**: Server-side rendering bridge
- **laravel-vite-plugin**: Auto-refreshing dev server

### Environment Variables
- `.env` file controls: `APP_NAME`, `DB_CONNECTION`, `APP_DEBUG`, `APP_KEY`
- Vite loads `VITE_*` prefixed vars only (access via `import.meta.env.VITE_*`)
- Testing uses in-memory SQLite + array cache (see `phpunit.xml`)

### File Organization
```
app/Models/          → Eloquent models
app/Http/Controllers → Route handlers
resources/js/Pages   → React page components (auto-resolved by routes)
resources/js/Layouts → AuthenticatedLayout, GuestLayout
resources/js/Components → Reusable UI widgets
database/migrations  → Schema changes (auto-discovered)
config/              → App config (app.php, database.php, auth.php, etc.)
routes/              → web.php (main), auth.php (auth routes), console.php (commands)
```

## Common Tasks

### Add a New Page
1. Create route in `routes/web.php`: `Route::get('/page-name', fn() => Inertia::render('PageName'))->name('page-name')`
2. Create component: `resources/js/Pages/PageName.jsx`
3. Use existing layout: `import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'` or `GuestLayout`

### Create a Model & Migration
```bash
php artisan make:model ModelName -m   # Creates app/Models/ModelName.php + migration
php artisan migrate                   # Run the new migration
```

### Add a Component
1. Create in `resources/js/Components/MyComponent.jsx`
2. Import in pages: `import MyComponent from '@/Components/MyComponent'`
3. Use relative path aliases via Vite config (already set up)

## Testing Notes
- Feature tests extend `TestCase` from `tests/TestCase.php`
- Database: in-memory SQLite during tests (fast, isolated)
- Run tests: `composer test` or `php artisan test`
- Use `RefreshDatabase` trait to reset DB between tests
