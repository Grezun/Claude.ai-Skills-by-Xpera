---
name: shadcn-compliance-xpera
description: Use when adding a UI component, styling a layout, or writing any React component that uses Tailwind — fires before and after writing component code
---

# shadcn/ui Compliance

## Core Rule

Every UI component must comply with three axes before it ships:

1. **Architecture** — shadcn/ui structure with Radix UI primitives
2. **Theme** — CSS variables, never hardcoded hex or raw colors
3. **Class order** — Tailwind utilities in the canonical Prettier order

Violating any axis is a compliance failure, not a style preference.

---

## Axis 1 — Component Architecture

### Required structure for every component

```tsx
import * as React from "react"
import * as Primitive from "@radix-ui/react-[name]"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const componentVariants = cva("base-classes-here", {
  variants: {
    variant: { default: "...", destructive: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "md" },
})

const Component = React.forwardRef<
  React.ElementRef<typeof Primitive.Root>,
  React.ComponentPropsWithoutRef<typeof Primitive.Root> &
    VariantProps<typeof componentVariants>
>(({ className, variant, size, ...props }, ref) => (
  <Primitive.Root
    ref={ref}
    className={cn(componentVariants({ variant, size }), className)}
    {...props}
  />
))
Component.displayName = Primitive.Root.displayName
```

### Architecture checklist

- [ ] Radix primitive as base (never write custom modal/dialog/dropdown/tooltip from scratch)
- [ ] `React.forwardRef` wrapping the component
- [ ] `displayName` set to Radix primitive's displayName
- [ ] `cva` for all variant logic — no conditional className strings
- [ ] `cn()` for merging base + variant + `className` prop
- [ ] `className` prop exposed and spread last (lets consumers override)
- [ ] `...props` spread onto the Radix root element

### Which Radix primitive to use

| UI element | Radix package |
|-----------|--------------|
| Dialog / Modal | `@radix-ui/react-dialog` |
| Dropdown menu | `@radix-ui/react-dropdown-menu` |
| Select | `@radix-ui/react-select` |
| Popover | `@radix-ui/react-popover` |
| Tooltip | `@radix-ui/react-tooltip` |
| Tabs | `@radix-ui/react-tabs` |
| Accordion | `@radix-ui/react-accordion` |
| Checkbox | `@radix-ui/react-checkbox` |
| Switch | `@radix-ui/react-switch` |
| Slider | `@radix-ui/react-slider` |
| Alert dialog | `@radix-ui/react-alert-dialog` |
| Context menu | `@radix-ui/react-context-menu` |

---

## Axis 2 — Theme Variables

### Never use hardcoded colors

```tsx
// ❌ Hardcoded hex
className="bg-[#1a1a2e] text-[#ffffff] border-[#e2e8f0]"
// ❌ Arbitrary Tailwind color
className="bg-slate-900 text-white border-slate-200"
// ❌ Inline style
style={{ backgroundColor: '#1a1a2e', color: '#fff' }}

// ✅ CSS variables via Tailwind
className="bg-background text-foreground border-border"
```

### CSS variable → Tailwind class mapping

| Role | Tailwind class |
|------|---------------|
| Page background | `bg-background` |
| Primary text | `text-foreground` |
| Primary action | `bg-primary` / `text-primary-foreground` |
| Secondary action | `bg-secondary` / `text-secondary-foreground` |
| Muted background | `bg-muted` / `text-muted-foreground` |
| Accent / hover bg | `bg-accent` / `text-accent-foreground` |
| Destructive action | `bg-destructive` / `text-destructive-foreground` |
| Card surface | `bg-card` / `text-card-foreground` |
| Popover surface | `bg-popover` / `text-popover-foreground` |
| Default border | `border-border` |
| Focus ring | `ring-ring` |
| Input background | `bg-input` |

---

## Axis 3 — Tailwind Class Order

Apply classes in this order (matches `prettier-plugin-tailwindcss`):

```
1. Layout       block flex grid hidden inline-flex ...
2. Position     relative absolute fixed sticky inset-0 top-0 z-10 ...
3. Overflow     overflow-hidden overflow-auto ...
4. Flexbox/Grid flex-col items-center justify-between gap-4 ...
5. Sizing       w-full h-10 min-h-screen max-w-md ...
6. Spacing      m-4 mt-2 mx-auto p-4 px-6 py-2 ...
7. Border       border border-t rounded-md rounded-lg ...
8. Background   bg-primary bg-muted ...
9. Typography   text-sm text-base font-medium leading-none tracking-tight ...
10. Color       text-foreground text-muted-foreground ...
11. Effects     shadow-sm ring-1 opacity-50 ...
12. Transitions transition-colors duration-200 ease-in-out ...
13. States      hover:bg-accent focus:outline-none disabled:opacity-50 ...
14. Responsive  sm:flex-row md:w-1/2 lg:gap-8 ...
15. Dark mode   dark:bg-card dark:text-foreground ...
```

**Canonical button example (correct order):**
```tsx
className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2
           rounded-md bg-primary text-sm font-medium text-primary-foreground
           shadow-sm transition-colors
           hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
```

---

## Red Flags — Flag and Fix

| Violation | Fix |
|-----------|-----|
| `style={{ color: '...' }}` for theming | Use Tailwind CSS variable class |
| `bg-[#hex]` or `text-[#hex]` | Replace with semantic token (`bg-primary`, etc.) |
| Custom modal/dialog built from `<div>` | Use `@radix-ui/react-dialog` |
| Conditional className: `` `btn ${active ? 'bg-blue' : ''}` `` | Use `cva` variants |
| No `forwardRef` | Wrap with `React.forwardRef` |
| No `className` prop | Add and merge with `cn()` |
| `className` is not last in spread | Move `className` to be overrideable |
| State modifiers before base classes | Reorder to canonical sequence |
| `font-bold text-lg mb-4 flex` (random order) | Reorder: flex → sizing → spacing → typography |

---

## Compliance Review Output Format

When reviewing a component, report:

```
## Axis 1 — Architecture
[PASS / FAIL + specific issues]

## Axis 2 — Theme Variables
[PASS / FAIL + specific hardcoded values found]

## Axis 3 — Class Order
[PASS / FAIL + reordered className if needed]

## Fixed Component
[Full corrected code if any axis failed]
```
