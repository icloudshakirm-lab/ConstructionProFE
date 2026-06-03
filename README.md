# ConstructPro

Angular 20 + **PrimeNG 20** construction ERP scaffold covering project management, inventory, resources, procurement, cost control, equipment, HR, documents, **site mobile**, and **BOQ / client billing**.

## Quick start

```bash
cd constructpro
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Tech stack

| Package        | Version |
| -------------- | ------- |
| Angular        | 20.x    |
| PrimeNG        | 20.x    |
| @primeng/themes| 20.x    |
| PrimeIcons     | latest  |

## Module map

| Route prefix   | Module                    |
| -------------- | ------------------------- |
| `/dashboard`   | Executive dashboard       |
| `/projects`    | Project Management        |
| `/inventory`   | Store & Inventory         |
| `/resources`   | Resource Management       |
| `/procurement` | Procurement               |
| `/cost-control`| Cost Control              |
| `/equipment`   | Equipment Management      |
| `/hr`          | HR & Payroll              |
| `/documents`   | Document Management       |
| `/site-mobile` | Site Mobile (differentiator) |
| `/boq-billing` | BOQ & Client Billing (differentiator) |

Each module has an **Overview** hub plus one route per sub-feature (placeholder screens ready for CRUD implementation).

## Project structure

```
src/app/
  core/constants/feature-registry.ts   # Single source of truth for modules & pages
  core/utils/feature-route.factory.ts  # Lazy routes generated from registry
  layout/main-layout/                  # Shell with sidebar navigation
  features/dashboard/                  # Landing dashboard
  features/module-hub/                 # Per-module overview grid
  shared/components/feature-placeholder/  # Sub-feature scaffold page
```

## Next steps

1. Add backend API services under `core/services/`.
2. Replace placeholder components with PrimeNG `Table`, `Dialog`, and reactive forms per screen.
3. Implement auth guards and role-based menu visibility.
4. Add a separate Ionic/Capacitor app for **Site Mobile** sharing the same API.

## Build

```bash
npm run build
```

Production output: `dist/constructpro`.
