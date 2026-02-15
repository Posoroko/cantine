# Nuxt 4 Project Boilerplate Guide

This document provides instructions for an AI agent to scaffold a new Nuxt 4 project following Studio Posoroko conventions.

---

## Project Overview

- **Framework:** Nuxt 4
- **Rendering:** 100% Client-Side Rendering (CSR only) - No SSR
- **Backend:** Directus (self-hosted on VPS via Docker in Plesk)
- **Styling:** Custom CSS architecture + Tailwind CSS utilities
- **Icons:** `@nuxt/icon` module

---

## Root Directory Structure

```
project-root/
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── netlify.toml              # If deploying to Netlify
├── app/
├── config/
├── documentation/
├── public/
├── server/
├── shared/
└── types/
```

### Folders to EXCLUDE (not needed for new projects)
- `scripts/` - Migration/generation scripts (project-specific)
- `tests/` - No tests for this project
- `mcp-servers/` - Custom MCP servers (project-specific)
- `migration-scripts/` - One-time migration tools
- `certificates/` - Local dev SSL certs (generate per-project if needed)
- `locales/` - No translations needed
- `guidelines/` - Documentation only

---

## /app Directory Structure

This is the main client application directory.

```
app/
├── app.vue                   # Root Vue component
├── app.config.ts             # App-level configuration
├── error.vue                 # Error page
├── spa-loading-template.html # Loading screen for SPA
├── components/
├── composables/
├── css/
├── layouts/
├── middleware/
├── pages/
├── plugins/
└── utils/
```

---

## Component Naming Convention

### Folder Structure Pattern

Components are organized in nested folders by domain/feature. Each component group has a `Main.vue` entry point.

```
components/
├── Architecture/             # App shell, layout primitives
│   ├── AppBox.vue
│   ├── Footer.vue
│   ├── Overlay/
│   │   └── Main.vue          # Entry point for Overlay components
│   ├── Panel/
│   │   └── Main.vue
│   └── ToolBars/
│       ├── Main.vue
│       ├── SideBar.vue
│       └── BottomBar.vue
├── Content/                  # Domain-specific content
│   ├── Jobs/                 # Example: Catering jobs
│   │   ├── Card/
│   │   │   ├── Main.vue      # <ContentJobsCardMain />
│   │   │   ├── Large.vue
│   │   │   └── Small.vue
│   │   ├── Details/
│   │   │   └── Main.vue
│   │   └── Form/
│   │       └── Main.vue
│   └── Clients/
│       └── Card/
│           └── Main.vue
├── Forms/                    # Reusable form components
│   ├── Input/
│   │   └── Main.vue
│   ├── Select/
│   │   └── Main.vue
│   └── DatePicker/
│       └── Main.vue
├── Buttons/                  # Button variants
│   └── Main.vue
├── Overlay/                  # Modals, toasts, etc.
│   └── Main.vue
└── Widgets/                  # Small reusable UI pieces
    └── Main.vue
```

### Naming Rules

1. **Folder names:** PascalCase (e.g., `HuntReports`, `DatePicker`)
2. **File names:** PascalCase with descriptive suffixes (e.g., `CardLarge.vue`, `FormEdit.vue`)
3. **Main.vue:** Each component group should have a `Main.vue` as its primary entry point
4. **Auto-import naming:** Nuxt auto-imports using folder path → `ContentJobsCardMain`

### Example Component Usage

```vue
<!-- These are equivalent due to Nuxt auto-imports -->
<ContentJobsCardMain />
<ContentJobsCardLarge />
<ArchitectureOverlayMain />
```

---

## CSS Architecture

### Critical: The `_main_.css` Pattern

Each CSS folder contains a `_main_.css` file that imports its siblings and subfolders.

```
css/
├── _styles_.css              # ROOT: Imports all CSS in correct order
├── base.css                  # Reset, box-sizing, html/body defaults
├── posoroko.css              # CRITICAL: Custom utility classes
├── architecture.css          # App shell layout styles
├── colors.css                # CSS custom properties for colors
├── typography.css            # Font families, sizes, text utilities
├── forms.css                 # Form element base styles
├── scrollbars.css            # Custom scrollbar styles
├── colors-and-themes/
│   ├── _main_.css            # Imports colors/ and themes/
│   ├── colors/
│   │   └── _main_.css
│   └── themes/
│       └── _main_.css
└── components/
    ├── _main_.css            # Imports all component CSS
    ├── buttons/
    │   └── _main_.css
    ├── cards/
    │   └── _main_.css
    ├── forms/
    │   └── _main_.css
    └── panels/
        └── _main_.css
```

### The `_styles_.css` Root File

This is the single entry point imported in `nuxt.config.ts`:

```css
/* _styles_.css */
@import url('./base.css');
@import url('./posoroko.css');
@import url('./colors-and-themes/_main_.css');
@import url('./architecture.css');
@import url('./colors.css');
@import url('./components/_main_.css');
@import url('./typography.css');
@import url('./forms.css');
@import url('./scrollbars.css');
```

### The `posoroko.css` File (CRITICAL)

This file contains custom utility classes that complement Tailwind. These are short, memorable class names for common patterns:

```css
/* posoroko.css - Essential utilities */

/* Dimensions */
.full { width: 100%; height: 100%; }
.w100 { width: 100%; }
.h100 { height: 100%; }

/* Display */
.block { display: block; }
.flex { display: flex; }
.column { flex-direction: column; }
.row { flex-direction: row; }
.wrap { flex-wrap: wrap; }

/* Flexbox alignment */
.justifyCenter { justify-content: center; }
.justifyBetween { justify-content: space-between; }
.alignCenter { align-items: center; }
.alignStart { align-items: flex-start; }

/* Flex sizing */
.grow { flex-grow: 1; }
.shrink0 { flex-shrink: 0; }

/* Gaps */
.gap5 { gap: 5px; }
.gap10 { gap: 10px; }
.gap15 { gap: 15px; }
.gap20 { gap: 20px; }

/* Positioning */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }

/* Centering */
.centered { display: grid; place-items: center; }

/* Debug helpers */
.r { border: 1px solid red; }
.b { border: 1px solid blue; }
.g { border: 1px solid green; }
```

---

## /shared Directory (CRITICAL)

The `/shared` folder contains code used by BOTH client (`/app`) and server (`/server`). 

**STRICT RULES:**
- NO browser APIs (`document`, `window`, `navigator`)
- NO server-only APIs
- NO Vue code (no `ref`, `computed`, `useState`)
- PURE TypeScript/JavaScript only

```
shared/
├── types/                    # TypeScript type definitions
│   ├── directus.ts           # Directus-specific types
│   ├── api.ts                # API request/response types
│   ├── user.ts               # User-related types
│   └── state.ts              # App state types
├── dataValidation/           # Validation functions
│   ├── forms.ts              # Form validation utilities
│   ├── email.ts              # Email format validation
│   ├── password.ts           # Password validation
│   └── text.ts               # Text/string validation
├── utils/                    # Shared utility functions
│   ├── error.ts              # Error formatting utilities
│   └── dataValidation.ts     # Generic validation helpers
└── cache.config.ts           # Cache configuration
```

### Example: shared/types/directus.ts

```typescript
export type {
    DirectusTokens,
    AccessToken
}

type DirectusTokens = {
    access_token: string
    refresh_token: string
    expires: number
}

type AccessToken = {
    value: string
    expires: number
}
```

### Example: shared/dataValidation/forms.ts

```typescript
export const validate = {
    passwordLength: (password: string): boolean => {
        return password.length >= 8
    },
    emailFormat: (email: string): boolean => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return emailRegex.test(email)
    },
    areEqual(one: any, two: any): boolean {
        return one === two
    }
}
```

---

## /composables Directory

Composables are Vue composition functions for reusable stateful logic.

```
composables/
├── userState.ts              # User authentication state
├── appState.ts               # Global app state
├── errors.ts                 # Error handling utilities
├── fetch.ts                  # API fetch wrapper
├── modal.ts                  # Modal state management
├── toaster.ts                # Toast notifications
└── [feature].ts              # Feature-specific composables
```

### Composable Conventions

1. **Export at the top** of the file
2. **Naming:** `useSomething()` for composables
3. **Use `useState`** for reactive state that persists across components

### Example: composables/userState.ts

```typescript
export const useUserState = () => {
    const userState = useState<UserState>(
        'userState',
        () => ({
            isLoggedIn: false,
            username: '',
            email: '',
            id: '',
            accessToken: {
                value: '',
                expires: 0
            }
        })
    )
    return userState
}

export function useClearUserState() {
    const userState = useUserState()
    
    userState.value = {
        isLoggedIn: false,
        username: '',
        email: '',
        id: '',
        accessToken: {
            value: '',
            expires: 0
        }
    }
    
    // Clear refresh token cookie
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}
```

### Example: composables/errors.ts

```typescript
export {
    useHandleError
}

function useHandleError(error: any) {
    if (!error) return
    
    // Show toast notification
    useToaster('show', {
        id: `${Math.random()}`,
        message: error.message || 'An error occurred',
        type: 'error',
        autoClose: true
    })
    
    // Log to console in development
    if (useAppConfig().showDebugLogs) {
        console.error('Error:', error)
    }
}
```

---

## /layouts Directory

Layouts define page structure patterns.

```
layouts/
├── default.vue               # Default layout (if needed)
├── private-route.vue         # Authenticated pages
└── public-route.vue          # Public pages (login, etc.)
```

### Example: layouts/private-route.vue

```vue
<template>
    <div 
        v-if="useUserState().value.isLoggedIn"
        class="full flex column"
    >
        <ArchitectureToolBarsMain />
        
        <div class="grow flex">
            <ArchitectureAppStructureSidebar />
            
            <main class="grow">
                <slot />
            </main>
        </div>
    </div>
    
    <div v-else>
        <p>Please log in to continue.</p>
    </div>
</template>
```

---

## /pages Directory

Pages map to routes automatically.

```
pages/
├── index.vue                 # Home page (/)
├── login.vue                 # Login page (/login)
├── dashboard/
│   └── index.vue             # Dashboard (/dashboard)
├── jobs/
│   ├── index.vue             # Jobs list (/jobs)
│   ├── new.vue               # New job form (/jobs/new)
│   └── [id].vue              # Job details (/jobs/:id)
└── clients/
    ├── index.vue             # Clients list (/clients)
    └── [id].vue              # Client details (/clients/:id)
```

---

## /server Directory

Server-side API routes (Nitro).

```
server/
├── tsconfig.json
└── api/
    ├── auth/
    │   ├── login.post.ts
    │   ├── logout.post.ts
    │   └── refresh.post.ts
    ├── jobs/
    │   ├── index.get.ts
    │   ├── index.post.ts
    │   └── [id].get.ts
    └── me/
        └── index.get.ts
```

### API Route Naming Convention
- `index.get.ts` → GET `/api/jobs`
- `index.post.ts` → POST `/api/jobs`
- `[id].get.ts` → GET `/api/jobs/:id`
- `[id].put.ts` → PUT `/api/jobs/:id`
- `[id].delete.ts` → DELETE `/api/jobs/:id`

---

## /config Directory

Modular configuration files.

```
config/
└── modules/
    └── icon.config.js        # @nuxt/icon configuration
```

---

## /public Directory

Static assets served directly.

```
public/
├── favicon.ico
├── images/
├── logo/
└── web-assets/
    └── og-image.png          # Open Graph image
```

---

## /types Directory

Global TypeScript type augmentations.

```
types/
└── index.d.ts                # Global type declarations
```

---

## nuxt.config.ts Template

```typescript
export default defineNuxtConfig({
    // CSR only - no SSR
    ssr: false,

    app: {
        baseURL: '/',
        head: {
            meta: [
                { property: 'og:type', content: 'website' },
                { property: 'og:site_name', content: 'Your App Name' },
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
            ]
        }
    },

    // Auto-imports for shared folder
    imports: {
        dirs: [
            '#shared',
            '#shared/types',
            '#shared/utils',
            '#shared/dataValidation'
        ]
    },

    devtools: {
        enabled: true
    },

    css: [
        '~/css/_styles_.css'
    ],

    modules: [
        '@vueuse/nuxt',
        '@nuxt/icon'
    ],

    runtimeConfig: {
        // Server-only secrets
        APP_ACCESS_TOKEN: process.env.APP_ACCESS_TOKEN,
        public: {
            // Client-accessible config
            DIRECTUS_URL: process.env.VITE_DIRECTUS_URL
        }
    },

    compatibilityDate: '2024-11-25',

    experimental: {
        spaLoadingTemplateLocation: 'body'
    }
})
```

---

## app.config.ts Template

```typescript
export default defineAppConfig({
    version: '1.0.0',
    appName: 'Your App Name',
    directusUrl: 'https://your-directus-instance.com',
    showDebugLogs: false,
    showErrorLogs: true
})
```

---

## app.vue Template

```vue
<script setup>
import {
    ArchitectureAppBox as AppBox,
    ArchitectureOverlayMain as Overlay
} from '#components'
</script>

<template>
    <AppBox>
        <template #content>
            <NuxtPage />
        </template>

        <template #overlay>
            <Overlay />
        </template>
    </AppBox>
</template>
```

---

## Essential Files Checklist

### Root Level
- [ ] `nuxt.config.ts`
- [ ] `app.config.ts` (in `/app`)
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `tailwind.config.ts`
- [ ] `.env` (not committed)
- [ ] `.gitignore`

### /app
- [ ] `app.vue`
- [ ] `error.vue`
- [ ] `spa-loading-template.html`

### /app/css
- [ ] `_styles_.css` (root import)
- [ ] `base.css`
- [ ] `posoroko.css`
- [ ] `colors.css`
- [ ] `typography.css`
- [ ] `architecture.css`

### /app/layouts
- [ ] `private-route.vue`
- [ ] `public-route.vue`

### /app/pages
- [ ] `index.vue`
- [ ] `login.vue`

### /app/composables
- [ ] `userState.ts`
- [ ] `errors.ts`
- [ ] `fetch.ts`
- [ ] `toaster.ts`

### /shared/types
- [ ] `directus.ts`
- [ ] `user.ts`
- [ ] `api.ts`

### /shared/dataValidation
- [ ] `forms.ts`
- [ ] `email.ts`

### /server/api/auth
- [ ] `login.post.ts`
- [ ] `logout.post.ts`
- [ ] `refresh.post.ts`

---

## Code Formatting Rules

Always follow these formatting standards:

### Indentation
- Use **4 spaces** (not tabs)

### Import/Export Order
1. `import` statements (external, then internal)
2. `import type` statements
3. `export` statements
4. `export type` statements

**Exports always at the top** of the file (after imports)

### Vue Template Attribute Order
1. `v-if` / `v-else-if` / `v-else`
2. `v-for` and `:key` (same line)
3. Event handlers (`@click`, `@input`, etc.)
4. Props (one per line)
5. `class` (static classes)
6. `:class` (dynamic classes)

### Vue Class Structure

**Static classes:**
```vue
class="
    targetClass
    flex items-center gap-2
    otherUtilityClass
"
```

**Dynamic classes:**
```vue
:class="[
    isActive ? 'active' : '',
    hasError ? 'error' : ''
]"
```

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Project-Specific Notes for Catering App

Since this is a simple internal SaaS for catering job management:

1. **No rate limiting** - Internal use only
2. **No translations** - Single language
3. **No email confirmation** - Simple login flow
4. **No password recovery** - Admin can reset manually
5. **No tests** - Small team, rapid iteration
6. **No Patreon integration** - Not needed
7. **Simple auth** - Just login/logout with Directus

### Suggested Collections (Directus)
- `Users` (built-in)
- `Jobs` (catering events)
- `Clients` (customers)
- `Menu_items` (dishes/products)
- `Staff` (team members for assignments)
- `Invoices` (if needed)
