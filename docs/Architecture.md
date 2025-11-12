# Architecture Overview

This document provides a consolidated view of how the MNK mobile application is structured.  
It replaces the previous scattered architecture notes (`ARCHITECTURE*.md`, `MULTI_COMPANY_ARCHITECTURE.md`, `NAVIGATION_SYSTEM.md`, etc.).

---

## 1. Technology Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Runtime | [Expo](https://expo.dev/) / React Native (TypeScript) | Managed workflow. |
| State & Data | React Hooks, Context API | `src/domains/shared/contexts` contains reusable contexts (e.g., MultiCompany). |
| HTTP Client | `apiClient` wrapper over `fetch` | Located at `src/infrastructure/api/api.client.ts`. Centralises interceptors, error handling and authentication headers. |
| Styling | Tailored theme system on top of React Native StyleSheet | Color tokens live in `src/styles/themes`. |
| Navigation | Expo Router | App routes under `app/` mirror navigation hierarchy. |

---

## 2. High-Level Module Layout

```
app/
 ├─ _layout.tsx            # Global layout (main menu, header, theme toggle)
 ├─ security/              # Navigation entry points for security modules
 └─ …                      # Additional feature areas (products, services, etc.)

src/
 ├─ domains/
 │   ├─ security/          # Bounded context for security/administration
 │   │   ├─ components/    # Reusable UI building blocks (forms, tables, modals)
 │   │   ├─ services/      # API accessors (UsersService, RolesService…)
 │   │   ├─ hooks/         # Domain specific hooks (branch/company options)
 │   │   └─ types/         # DTOs, filters and payload definitions
 │   ├─ shared/            # Cross-domain components, contexts, utilities
 │   └─ catalog/           # Example of additional bounded context
 │
 ├─ infrastructure/
 │   ├─ api/               # HTTP client, config, error constants
 │   ├─ i18n/              # Translation system and language context
 │   ├─ menu/              # Dynamic main menu configuration
 │   └─ messages/          # Toasts and alert services
 │
 ├─ styles/                # Centralised design tokens and page/component styles
 └─ hooks/                 # Global hooks (theme mode, responsiveness, etc.)
```

---

## 3. Application Flow

1. **Entry point** – Expo Router loads `_layout.tsx`, which wraps the app with:
   - `ThemeProvider` (`hooks/use-theme-mode.tsx`)
   - `LanguageProvider`
   - `MultiCompanyProvider`
   - `ToastProvider`

2. **Navigation** – Each feature screen lives under `app/<feature>/index.tsx`.  
   For security, the route stack (`app/security/`) points to list screens which consume domain services.

3. **Data Access** – Screens interact with domain services (e.g., `UsersService`) which in turn use the shared `apiClient`.  
   Responses are mapped to domain types before reaching the UI layer.

4. **State Management** – Local component state via React hooks. Shared state (company selection, theme) travels through contexts in `src/domains/shared/contexts`.

5. **Styling** – Component styles reference theme tokens (`colors.primary`, `colors.surface`, etc.). Theme overrides propagate automatically.

---

## 4. Security Domain Responsibilities

| Module | Description | Key Files |
| --- | --- | --- |
| Users | CRUD for application users, status management (Active/Pending/Suspended/Deleted). | `app/security/users/index.tsx` + forms under `src/domains/security/components`. |
| Roles & Permissions | Administration of RBAC entities, mapping roles to permissions. | `app/security/roles/index.tsx`, `app/security/permissions/index.tsx`. |
| Companies & Branches | Multi-company support with branch assignment to users. | `app/security/companies/index.tsx`, `app/security/branches/index.tsx`. |
| Shared utilities | Hooks to fetch options (`use-company-options`, `use-branch-options`), status badge, etc. | `src/domains/security/hooks`, `components/ui/status-badge.tsx`. |

---

## 5. Multi-Company Integration

* Multi-company context: `src/domains/shared/contexts/multi-company.context.tsx`.  
  Provides `useMultiCompany()` hook for current company & branch awareness.
* User forms rely on this context to pre-select company and filter available branches.
* Services accept optional `companyId` parameters; queries include them when provided.

---

## 6. Error & Toast Handling

* `useAlert()` (`src/infrastructure/messages/alert.service.ts`) abstracts platform-specific alerts and toast notifications.
* Network errors are surfaced via `ToastContainer` (overlays in web using a transparent modal) ensuring visibility above modals.

---

## 7. Testing & Extensibility Guidelines

* Prefer creating new domain folders under `src/domains/<module>` for future modules.
* Share UI components via `src/domains/shared/components` or `components/ui` to keep consistency.
* When adding new routes, create the screen under `app/<feature>/` and keep route-specific logic inside the screen while delegating business logic to domain services.
* Follow the status system (see ADR) when introducing new entities with lifecycle states.

---

For implementation details and functional behaviour refer to `SystemOverview.md`. Critical decisions are catalogued in `ADR.md`. Design and theming instructions live in `DesignSystem.md`.

