# Documentation Generation

This document explains how drei's documentation system works, including how to write TSDoc comments that automatically generate MDX documentation for [docs.pmnd.rs](https://docs.pmnd.rs).

## Overview

Drei uses a TSDoc-to-MDX generation system that:

1. Extracts documentation from component TSDoc/JSDoc comments
2. Generates MDX files for the pmndrs/docs documentation site
3. Supports optional `.docs.mdx` templates for complex components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Build Script                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Component.tsx ──────► Extract TSDoc ──────┐                    │
│       │                                    │                    │
│       │                                    ▼                    │
│       │                         ┌──────────────────┐            │
│       │                         │  Auto-generated  │            │
│       │                         │  content block   │            │
│       │                         └────────┬─────────┘            │
│       │                                  │                      │
│       ▼                                  ▼                      │
│  Component.docs.mdx exists?     ┌────────────────────┐          │
│       │                         │                    │          │
│       ├── NO ──────────────────►│  Output full MDX   │          │
│       │                         │  (auto-generated)  │          │
│       │                         └────────────────────┘          │
│       │                                                         │
│       └── YES ─────► Process template ─────► Output MDX         │
│                      with {/* AUTO:x */}     (merged)           │
│                      injection tags                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Generate all docs

```bash
yarn docs:generate
```

### Generate docs for a specific component

```bash
yarn docs:generate Billboard
```

## Writing TSDoc for Components

### Basic Structure

Add a JSDoc comment immediately before your component's `export`:

```tsx
/**
 * Short description of what the component does.
 * Additional context or details on a second line.
 *
 * @example Basic usage
 * ```jsx
 * <MyComponent>
 *   <Children />
 * </MyComponent>
 * ```
 *
 * @example With options
 * ```jsx
 * <MyComponent option={true} value={42}>
 *   <Children />
 * </MyComponent>
 * ```
 */
export const MyComponent = ...
```

### Documenting Props

Add JSDoc comments to each prop in your Props type:

```tsx
export type MyComponentProps = {
  /** Whether the component is active. @default true */
  enabled?: boolean
  /** Lock updates on the X axis. @default false */
  lockX?: boolean
  /** Callback fired when value changes */
  onChange?: (value: number) => void
}
```

### Reference Implementation

See `src/core/Abstractions/Billboard/Billboard.tsx` for a complete example of proper TSDoc formatting.

## File Structure

```
src/core/Abstractions/Billboard/
  Billboard.tsx           # Component with TSDoc
  Billboard.stories.tsx   # Storybook stories
  Billboard.docs.mdx      # Optional - extended docs template

docs/abstractions/
  billboard.mdx           # Generated output
```

## Generated Output

For a component with TSDoc but no `.docs.mdx` template, the script generates:

```mdx
---
title: Billboard
sourcecode: src/core/Abstractions/Billboard/Billboard.tsx
---

[![storybook badge](https://img.shields.io/badge/-storybook-%23ff69b4)](...)

Short description of what the component does.

### Basic usage

```jsx
<Billboard>
  <Text>I'm a billboard</Text>
</Billboard>
```

### With options

```jsx
<Billboard follow={true} lockY={true}>
  <Plane args={[3, 2]} />
</Billboard>
```
```

## Extended Documentation with Templates

For complex components that need hand-written documentation (like CameraControls), create a `.docs.mdx` template file alongside the component:

### Template File (`Component.docs.mdx`)

```mdx
{/* AUTO:badges */}

{/* AUTO:description */}

{/* AUTO:example */}

## Events

Hand-written content about events...

<Grid cols={4}>
  <Codesandbox id="abc123" />
</Grid>

## Advanced Configuration

More hand-written documentation...
```

### Available Injection Tags

| Tag | Description |
|-----|-------------|
| `{/* AUTO:badges */}` | Storybook/suspense badges |
| `{/* AUTO:description */}` | Component description from TSDoc |
| `{/* AUTO:example */}` | All `@example` blocks from TSDoc |
| `{/* AUTO:props */}` | Props table generated from types |
| `{/* AUTO:all */}` | All of the above in default order |

## Configuration

### Category Mappings

Component categories are mapped to doc folders in `scripts/docs-config.ts`:

```ts
export const docCategories: Record<string, string> = {
  'Abstractions': 'abstractions',
  'Cameras': 'cameras',
  'Controls': 'controls',
  'Staging': 'staging',
  // ...
}
```

### Component Overrides

For components that need special badges or metadata:

```ts
export const componentOverrides: Record<string, {...}> = {
  'Html': { domOnly: true },
  'useGLTF': { suspense: true },
}
```

## Supported JSDoc Tags

| Tag | Usage |
|-----|-------|
| `@example` | Code examples with optional titles |
| `@default` | Default value for props (inline in description) |
| `@see` | Links to related resources |
| `@remarks` | Additional notes |

## Troubleshooting

### "No JSDoc found for ComponentName"

The script couldn't find a multi-line JSDoc comment immediately before the component export. Ensure:

1. The comment starts with `/**` and ends with `*/`
2. It's a multi-line comment (not single-line `/** ... */`)
3. It appears directly before `export const ComponentName` or `export function ComponentName`

### "No component found in ComponentName.tsx"

`react-docgen-typescript` couldn't parse the component. This happens with:

- Hooks (they're functions, not components)
- Components using complex patterns react-docgen doesn't understand
- Files that only export types

### Examples not showing up

Ensure your `@example` blocks follow this exact format:

```tsx
/**
 * @example Title here
 * ```jsx
 * <Code here />
 * ```
 */
```

The code fence must use `jsx`, `tsx`, or `js` language identifier.

## Scripts Reference

| Script | Description |
|--------|-------------|
| `yarn docs:generate` | Generate docs for all components |
| `yarn docs:generate ComponentName` | Generate docs for specific component |
| `yarn docs:generate:watch` | Watch mode (re-generate on changes) |
| `yarn docs:generate --no-backup` | Skip backup of existing docs |

---

## Watch Mode

The watch mode provides live documentation regeneration as you edit component files.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        Watch Mode                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Initial Generation                                           │
│     └─► Generates all docs once on startup                       │
│     └─► Builds component map for quick lookup                    │
│                                                                  │
│  2. File Watcher (chokidar)                                      │
│     └─► Watches: src/**/*.tsx, src/**/*.docs.mdx                 │
│     └─► Ignores: *.stories.tsx, node_modules, dotfiles           │
│                                                                  │
│  3. On File Change                                               │
│     └─► Identifies which component was modified                  │
│     └─► Re-extracts TSDoc from source                            │
│     └─► Regenerates only that component's MDX                    │
│     └─► Outputs to correct docs/ location                        │
│                                                                  │
│  4. On New File                                                  │
│     └─► Re-discovers all components                              │
│     └─► Updates internal component map                           │
│     └─► Generates docs for new component                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Starting Watch Mode

```bash
yarn docs:generate:watch
```

Output:
```
📚 TSDoc to MDX Documentation Generator

📦 Backup already exists at docs-original/

🔍 Discovering components...
   Found 42 components

📄 core/Abstractions/Billboard/Billboard.tsx
   ✓ Generated: abstractions/billboard.mdx
...

──────────────────────────────────────────────────
✅ Generated: 42
⏭  Skipped: 0

👀 Watching for changes... (Ctrl+C to stop)
   Watching: C:\path\to\drei\src
   File types: *.tsx, *.docs.mdx
```

### What Gets Watched

| File Type | Action on Change |
|-----------|------------------|
| `Component.tsx` | Regenerates that component's MDX |
| `Component.docs.mdx` | Regenerates using the updated template |
| `*.stories.tsx` | Ignored (no docs impact) |
| New component folder | Detected and added to watch |

### Example Output on Change

When you save a file:
```
🔄 Changed: core/Abstractions/Billboard/Billboard.tsx
   ✅ Updated: abstractions/billboard.mdx
```

If using a template:
```
🔄 Changed: core/Controls/CameraControls/CameraControls.docs.mdx
   📝 Using template: CameraControls.docs.mdx
   ✅ Updated: controls/camera-controls.mdx
```

### Workflow Tips

1. **Run alongside your editor** - Keep watch mode running in a terminal while editing components
2. **Check output immediately** - Changes appear in `docs/` within ~100ms of saving
3. **Pair with pmndrs/docs** - Run the docs site locally to see rendered changes in real-time
4. **Skip backup on repeated runs** - Use `--no-backup` if you don't need to preserve the original docs folder

### Stopping Watch Mode

Press `Ctrl+C` to stop the watcher.

---

## Related Files

- `scripts/generate-docs.ts` - Main generation script
- `scripts/docs-config.ts` - Configuration and mappings
- `docs/` - Generated MDX output directory

