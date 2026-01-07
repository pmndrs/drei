---
name: JSDoc from Clean Docs
overview: Process all components to extract documentation from `docs-original/`, write JSDoc to source files, and create `.docs.mdx` templates for rich content that can't be expressed in JSDoc.
todos:
  - id: batch-1
    content: Process Abstractions category (~15 components)
    status: completed
  - id: batch-2
    content: Process Controls category (~15 components)
    status: completed
    dependencies:
      - batch-1
  - id: batch-3
    content: Process Cameras category (~5 components)
    status: completed
    dependencies:
      - batch-2
  - id: batch-4
    content: Process Geometry category (~15 components)
    status: completed
    dependencies:
      - batch-3
  - id: batch-5
    content: Process Staging category (~20 components)
    status: in_progress
    dependencies:
      - batch-4
  - id: batch-6
    content: Process Loaders category (~15 components)
    status: pending
    dependencies:
      - batch-5
  - id: batch-7
    content: Process Misc categories (~20 components)
    status: pending
    dependencies:
      - batch-6
  - id: validate
    content: Run docs:generate and compare output with docs-original
    status: pending
    dependencies:
      - batch-7
---

# Regener

ate JSDoc from Clean Documentation Source

## Strategy

For each component with docs in `docs-original/`:

1. **Extract from original docs:**

- Description text
- Code examples
- Prop documentation (if inline in docs)

2. **Write to source `.tsx` file:**

- Component JSDoc with description and `@example` blocks
- Prop JSDoc comments on the Props type

3. **Create `.docs.mdx` template** (only if rich content exists):

- Use `{/* AUTO:badges */}`, `{/* AUTO:description */}`, `{/* AUTO:example */}` for auto-generated parts
- Preserve Codesandbox embeds, Grid layouts, and custom hand-written sections
```javascript
docs-original/clone.mdx          (read)
        │
        ├──► src/.../Clone.tsx   (write JSDoc)
        │
        └──► src/.../Clone.docs.mdx  (create template if rich content)
```




## Implementation Batches

Process components by category to maintain focus:| Batch | Category | Est. Components ||-------|----------|-----------------|| 1 | Abstractions | ~15 || 2 | Controls | ~15 || 3 | Cameras | ~5 || 4 | Geometry (Gizmos, Shapes) | ~15 || 5 | Staging | ~20 || 6 | Loaders | ~15 || 7 | Misc (Helpers, Shaders, Performance) | ~20 |

## Key Files

- **Source docs:** `docs-original/` (preserved backup)
- **Source files:** `src/core/*/` and `src/external/*/`
- **Config:** [scripts/docs-config.ts](scripts/docs-config.ts)
- **Generator:** [scripts/generate-docs.ts](scripts/generate-docs.ts)
- **Reference:** [docs/development/DOCS_GENERATION.md](docs/development/DOCS_GENERATION.md)

## Workflow Per Component

1. Read `docs-original/{category}/{component}.mdx`
2. Parse content:

- Extract description (first paragraph after frontmatter)
- Extract code blocks as examples
- Identify rich content (Codesandbox, Grid, custom sections)

3. Update `src/{tier}/{Category}/{Component}/{Component}.tsx`:

- Add/update JSDoc above export
- Add/update prop comments on Props type

4. If rich content exists, create `{Component}.docs.mdx` template with injection tags
5. Run `yarn docs:generate` after each batch to verify

## Validation