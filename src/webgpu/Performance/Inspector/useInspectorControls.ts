import { useEffect, useId, useRef, useState } from 'react'
import { useInspectorContext } from './Inspector'

/**
 * A single control. The editor type is inferred from `value`:
 * number + min/max -> slider, number + min -> number input, boolean ->
 * checkbox, string -> text, `options` -> select, `color`/hex -> color picker.
 */
export interface Control<V> {
  value: V
  label?: string
  min?: number
  max?: number
  step?: number
  color?: boolean
  options?: readonly V[] | Record<string, V>
  onChange?: (value: V) => void
}

/** A nested, collapsible group of controls. */
export interface Folder<S extends ControlSchema = ControlSchema> {
  label?: string
  collapsed?: boolean
  schema: S
}

export type ControlSchema = Record<string, Control<any> | Folder<any>>

export type ControlValues<S extends ControlSchema> = {
  [K in keyof S]: S[K] extends Folder<infer FS> ? ControlValues<FS> : S[K] extends Control<infer V> ? V : never
}

export interface InspectorControlsOptions {
  /** Group title shown in the Inspector Parameters tab, default: auto-generated */
  title?: string
  /** Whether the top-level group starts collapsed, default: false */
  collapsed?: boolean
}

interface InspectorEditor {
  onChange(callback: (value: unknown) => void): unknown
  name(label: string): unknown
}

interface InspectorGroup {
  paramList: unknown
  add(object: object, property: string, ...params: unknown[]): InspectorEditor
  addColor(object: object, property: string): InspectorEditor
  addFolder(name: string): InspectorGroup
  name(name: string): unknown
  close(): unknown
}

interface InspectorParameters {
  createGroup(name: string): InspectorGroup
  paramList?: { remove(item: unknown): unknown }
  groups?: unknown[]
  show?(): void
}

function isFolder(entry: Control<any> | Folder<any>): entry is Folder<any> {
  return (entry as Folder<any>).schema !== undefined
}

function isColorValue(value: unknown): boolean {
  return (
    (value as { isColor?: boolean } | null)?.isColor === true ||
    (typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value))
  )
}

function buildInitialValues(schema: ControlSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key in schema) {
    const entry = schema[key]
    out[key] = isFolder(entry) ? buildInitialValues(entry.schema) : entry.value
  }
  return out
}

/** Immutably set a nested value, cloning each object along the path. */
function setIn(obj: Record<string, unknown>, path: readonly string[], value: unknown): Record<string, unknown> {
  const [head, ...rest] = path
  return {
    ...obj,
    [head]: rest.length === 0 ? value : setIn(obj[head] as Record<string, unknown>, rest, value),
  }
}

function addControl(
  group: InspectorGroup,
  backing: Record<string, unknown>,
  key: string,
  control: Control<any>
): InspectorEditor {
  backing[key] = control.value

  if (control.options !== undefined) {
    return group.add(backing, key, control.options)
  }
  if (control.color === true || isColorValue(control.value)) {
    return group.addColor(backing, key)
  }
  if (typeof control.value === 'number' && control.min !== undefined && control.max !== undefined) {
    return group.add(backing, key, control.min, control.max, control.step)
  }
  if (typeof control.value === 'number' && control.min !== undefined) {
    return group.add(backing, key, control.min)
  }
  return group.add(backing, key)
}

/**
 * Bind a set of reactive controls to the three.js Inspector "Parameters" tab.
 *
 * @param schema Control schema describing values, ranges, folders, and labels.
 * @param options Optional Inspector group options.
 *
 * @example
 * const { speed, color } = useInspectorControls(
 *   {
 *     speed: { value: 1, min: 0, max: 4, step: 0.1 },
 *     color: { value: '#ff8c42', color: true },
 *   },
 *   { title: 'Inspector Controls' }
 * )
 */
export function useInspectorControls<S extends ControlSchema>(
  schema: S,
  options: InspectorControlsOptions = {}
): ControlValues<S> {
  const inspector = useInspectorContext()
  const id = useId()
  const { title, collapsed } = options

  // Keep the latest schema available to the mount-only effect.
  const schemaRef = useRef(schema)
  schemaRef.current = schema

  const [values, setValues] = useState<ControlValues<S>>(() => buildInitialValues(schema) as ControlValues<S>)

  useEffect(() => {
    const parameters = (inspector as unknown as { parameters: InspectorParameters }).parameters
    if (!parameters || typeof parameters.createGroup !== 'function') return

    const root = parameters.createGroup(title ?? `Controls ${id}`)

    const populate = (group: InspectorGroup, currentSchema: ControlSchema, path: readonly string[]) => {
      const backing: Record<string, unknown> = {}

      for (const key in currentSchema) {
        const entry = currentSchema[key]

        if (isFolder(entry)) {
          const folder = group.addFolder(entry.label ?? key)
          populate(folder, entry.schema, [...path, key])
          if (entry.collapsed) folder.close()
          continue
        }

        const editor = addControl(group, backing, key, entry)
        if (entry.label) editor.name(entry.label)

        const fullPath = [...path, key]
        editor.onChange((value) => {
          setValues((prev) => setIn(prev as Record<string, unknown>, fullPath, value) as ControlValues<S>)

          let node: ControlSchema | undefined = schemaRef.current
          for (let i = 0; i < fullPath.length - 1 && node; i++) {
            node = (node[fullPath[i]] as Folder<any> | undefined)?.schema
          }
          ;(node?.[key] as Control<any> | undefined)?.onChange?.(value)
        })
      }
    }

    populate(root, schemaRef.current, [])

    if (collapsed) root.close()

    parameters.show?.()

    return () => {
      parameters.paramList?.remove(root.paramList)

      const groups = parameters.groups
      if (!Array.isArray(groups)) return

      const index = groups.indexOf(root)
      if (index !== -1) groups.splice(index, 1)
    }
  }, [collapsed, id, inspector, title])

  return values
}
