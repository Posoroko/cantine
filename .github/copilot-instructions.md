# Copilot Instructions

Always follow the code formatting guidelines in `documentation/code-style.md`.

## Quick Reference

### Indentation
- Use 4 spaces (not tabs)

### Import/Export Order
1. `import` statements
2. `import type` statements  
3. `export` statements
4. `export type` statements
5. variables and funcitons
6. type declarations

### Multiple Imports/Exports
- One item per line (unless 2 or fewer)
- Exports always at the top, after imports

### Vue Template Attribute Order
1. `v-if` / `v-else-if` / `v-else`
2. `v-for` and `:key` (same line)
3. Event handlers (`@click`, `@input`)
4. Props (one per line)
5. `class` (static)
6. `:class` (dynamic)

### CSS Classes
- camelCase for class names (not kebab-case)
- kebab-case only for CSS variables

### Static Classes Structure
```vue
class="
    targetClass
    flex alignCenter gap10
    otherUtilityClass
"
```

### Dynamic Classes
```vue
:class="[
    isActive ? 'active' : '',
    isDisabled ? 'disabled' : ''
]"
```


### Composables vs Utils
- **Composables** (`src/composables/`): use Vue reactivity (`ref`, `computed`, `watch`, lifecycle hooks)
- **Utils** (`src/utils/`, `shared/utils/`): pure functions with no Vue dependency

### Composable Patterns: Shared State vs Scoped
- **Shared/global state**: export refs and functions directly (no `useXxx()` wrapper)
  ```ts
  export const appAssetStore = ref(...)
  export async function loadAppAssets() { ... }
  ```
- **Scoped per-call instances**: wrap in `useXxx()` — each call creates its own reactive state
  ```ts
  export function useCounter() {
      const count = ref(0)
      function increment() { count.value++ }
      return { count, increment }
  }
  ```
- Also use `useXxx()` when the function accepts parameters to configure behavior

### c5t comments

c5t is a newstandard foro writting comments. it must be used throughout the app.
please refer to the c5t.md file for complete ruleset
