# Types Migration Guide

This guide explains the new types structure for drei and how to migrate component types.

## 🎯 Goals

- **Cleaner component files** - Focus on implementation, not type definitions
- **No import/export type chains** - Types are globally available via ambient declarations
- **Better organization** - Types grouped by category for easy discovery
- **WebGPU compatibility** - Types work across GL/GPU variants without imports

## 📁 Structure

```
src/types/
├── README.md              # Detailed usage instructions
├── EXAMPLE.md             # Migration examples
├── abstractions.d.ts      # Billboard, Edges, Trail, etc.
├── loaders.d.ts          # CubeTexture, Texture, VideoTexture, etc.
├── materials.d.ts        # Material components
├── controls.d.ts         # Control components
├── cameras.d.ts          # Camera components
├── staging.d.ts          # Lighting & staging
└── misc.d.ts            # Utilities
```

## ✅ What's Been Set Up

### 1. TypeScript Configuration

- Added `typeRoots: ["./node_modules/@types", "./src/types"]` to `tsconfig.json`
- All `.d.ts` files in `src/types/` are automatically picked up

### 2. Initial Type Files Created

- **loaders.d.ts** - CubeTexture, Texture types
- **abstractions.d.ts** - Edges, GradientTexture types
- Placeholder category files for future migrations

### 3. Example Migrations Completed

- ✅ `CubeTexture.tsx` - Types moved to `loaders.d.ts`
- ✅ `Texture.tsx` - Types moved to `loaders.d.ts`
- ✅ `Edges.tsx` - Types moved to `abstractions.d.ts`
- ✅ `GradientTexture.tsx` - Types moved to `abstractions.d.ts`

## 🚀 How to Migrate a Component

### Step 1: Identify the Category

Choose the appropriate category file or create a new one:

- Loaders → `loaders.d.ts`
- Materials → `materials.d.ts`
- Controls → `controls.d.ts`
- Cameras → `cameras.d.ts`
- Staging → `staging.d.ts`
- Misc/Utils → `misc.d.ts`

### Step 2: Move Types to Category File

**Before** (`src/core/MyComponent.tsx`):

```typescript
import { Mesh } from 'three'

export type MyComponentProps = {
  color: string
  size: number
}

export function MyComponent({ color, size }: MyComponentProps) {
  // ...
}
```

**After** (`src/types/misc.d.ts`):

```typescript
declare type MyComponentProps = {
  color: string
  size: number
}
```

**After** (`src/core/MyComponent.tsx`):

```typescript
// No type import needed - MyComponentProps is globally available!
export function MyComponent({ color, size }: MyComponentProps) {
  // ...
}
```

### Step 3: Handle External Types

Use `import()` syntax for external types in `.d.ts` files:

```typescript
declare type MyProps = {
  mesh: import('three').Mesh
  color: import('three').ColorRepresentation
  element: import('@react-three/fiber').ThreeElements['mesh']
}
```

### Step 4: Handle Enums (Special Case)

⚠️ **Enums require runtime code** - keep them in component files:

```typescript
// src/core/GradientTexture.tsx
export enum GradientType {
  Linear = 'linear',
  Radial = 'radial',
}

// Then in types file, reference as union:
// src/types/abstractions.d.ts
declare type GradientTextureProps = {
  type?: 'linear' | 'radial' // Union instead of enum
}
```

## 📋 Migration Checklist

When migrating a component:

- [ ] Identify the appropriate category file
- [ ] Copy type definitions to category file
- [ ] Use `declare type` or `declare interface`
- [ ] Replace external type imports with `import()` syntax
- [ ] Keep enums, classes, or runtime values in component files
- [ ] Remove type exports from component file
- [ ] Test: `npm run typecheck`
- [ ] Test: `npm run build`

## 🎨 Naming Conventions

- **Component Props**: `{ComponentName}Props` (e.g., `CubeTextureProps`)
- **Component Ref**: `{ComponentName}Ref` (e.g., `EdgesRef`)
- **Options**: `{ComponentName}Options` (e.g., `CubeTextureOptions`)
- **Config**: `{ComponentName}Config`

## 🔍 Finding Types

Since types are global, you can use them anywhere without imports. Use your IDE's:

- **Go to Definition** (F12) - Jump to type definition
- **Peek Definition** (Alt+F12) - View type without leaving file
- **Type Hierarchy** - See all related types

## 📦 When to Create Folders

Start with category files. When a category grows to 15+ type declarations, migrate to a folder:

```
types/
├── materials/
│   ├── materials.d.ts       # Shared types
│   ├── reflector.d.ts
│   ├── transmission.d.ts
│   └── portal.d.ts
```

## ⚠️ Important Rules

**DO:**

- ✅ Use `declare type` or `declare interface`
- ✅ Use `import('module')` for external types
- ✅ Keep files as pure declarations (no runtime code)
- ✅ Add section comments with `//*` for organization

**DON'T:**

- ❌ Use `export` (breaks ambient declarations)
- ❌ Use top-level `import` statements
- ❌ Include runtime code (functions, classes, enums)
- ❌ Import these types in component files (they're global!)

## 🧪 Testing

After migration, always run:

```bash
npm run typecheck  # Verify types
npm run build      # Verify build
```

## 📚 Examples

See `src/types/EXAMPLE.md` for detailed migration examples.

## 🆘 Troubleshooting

### "Cannot find name 'MyType'"

- Check the type is declared with `declare type` in a `.d.ts` file
- Verify `typeRoots` in `tsconfig.json` includes `"./src/types"`
- Restart TypeScript server in IDE

### "Type is not assignable"

- Check external types use `import()` syntax
- Verify type names match exactly (case-sensitive)

### Build fails after migration

- Ensure no runtime code (enums, classes) in `.d.ts` files
- Check no `export` statements in type files
- Verify all referenced types exist

## 🎯 Next Steps

As we refactor for WebGPU variants:

1. Continue migrating types from component files
2. Create material-specific type folders when needed
3. Add WebGPU-specific types in appropriate categories
4. Keep core/gl/webgpu implementations clean with shared types
