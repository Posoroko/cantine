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
