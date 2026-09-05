import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useInspectorContext } from './Inspector'

/**
 * The value determines the editor. Numbers with both bounds use sliders.
 * Options use selects. Hex values and explicit colors use color pickers.
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
  /** Group title in the Parameters tab. Defaults to "Controls". */
  title?: string
  /** Whether the group starts collapsed. Defaults to false. */
  collapsed?: boolean
}

interface InspectorEditor {
  onChange(callback: (value: unknown) => void): unknown
  name(label: string): unknown
}

interface InspectorGroup {
  paramList: { isOpen: boolean; toggle(): void }
  add(object: object, property: string, ...params: unknown[]): InspectorEditor
  addColor(object: object, property: string): InspectorEditor
  addNumber(object: object, property: string, min?: number, max?: number): InspectorEditor & { input: HTMLInputElement }
  addFolder(name: string): InspectorGroup
  name(name: string): unknown
  close(): unknown
}

interface InspectorParameters {
  createGroup(name: string): InspectorGroup
  paramList: { remove(item: unknown): unknown }
  groups: unknown[]
  show(): void
}

function isFolder(entry: Control<any> | Folder<any>): entry is Folder<any> {
  return (entry as Folder<any>).schema !== undefined
}

function isColorControl({ color, value }: Control<any>): boolean {
  return (
    color === true ||
    value?.isColor === true ||
    (typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value))
  )
}

/** Preserve color types and clone Color instances to avoid sharing mutable values. */
function readValue(control: Control<any>, value = control.value): any {
  if (isColorControl(control) && typeof control.value === 'string') {
    if (typeof value === 'number') return '#' + value.toString(16).padStart(6, '0')
    if (typeof value === 'string') {
      return value.length === 4 ? '#' + [...value.slice(1)].map((c) => c + c).join('') : value.toLowerCase()
    }
  }
  return value?.isColor ? value.clone() : value
}

function buildInitialValues(schema: ControlSchema): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(schema).map(([key, entry]) => [
      key,
      isFolder(entry) ? buildInitialValues(entry.schema) : readValue(entry),
    ])
  )
}

/** Immutably set a nested value, cloning each object along the path. */
function setIn(obj: Record<string, unknown>, path: readonly string[], value: unknown): Record<string, unknown> {
  const [head, ...rest] = path
  return {
    ...obj,
    [head]: rest.length === 0 ? value : setIn(obj[head] as Record<string, unknown>, rest, value),
  }
}

/** Bind reactive controls to the Inspector's Parameters tab. */
export function useInspectorControls<S extends ControlSchema>(
  schema: S,
  options: InspectorControlsOptions = {}
): ControlValues<S> {
  const inspector = useInspectorContext()
  const invalidate = useThree((state) => state.invalidate)
  const { title, collapsed } = options

  // Keep callbacks current without rebuilding controls.
  const schemaRef = useRef(schema)
  schemaRef.current = schema

  const [values, setValues] = useState<ControlValues<S>>(() => buildInitialValues(schema) as ControlValues<S>)
  const valuesRef = useRef(values)
  const rootRef = useRef<InspectorGroup | null>(null)

  useEffect(() => {
    if (!inspector) return
    const parameters = (inspector as unknown as { parameters: InspectorParameters }).parameters

    const root = parameters.createGroup(title ?? 'Controls')
    rootRef.current = root
    const editors: InspectorEditor[] = []
    let active = true

    function populate(
      group: InspectorGroup,
      currentSchema: ControlSchema,
      currentValues: Record<string, unknown>,
      path: readonly string[]
    ) {
      for (const key of Object.keys(currentSchema)) {
        const entry = currentSchema[key]

        if (isFolder(entry)) {
          const folder = group.addFolder(entry.label ?? key)
          populate(folder, entry.schema, currentValues[key] as Record<string, unknown>, [...path, key])
          if (entry.collapsed) folder.close()
          continue
        }

        const control = { ...entry, value: currentValues[key] }
        const backing = { [key]: readValue(control) }
        let editor: InspectorEditor
        if (control.options !== undefined) {
          editor = group.add(backing, key, control.options)
        } else if (isColorControl(control)) {
          editor = group.addColor(backing, key)
        } else if (typeof control.value === 'number') {
          if (control.min !== undefined && control.max !== undefined) {
            editor = group.add(backing, key, control.min, control.max, control.step)
          } else {
            const number = group.addNumber(backing, key, control.min, control.max)
            if (control.step !== undefined) number.input.step = String(control.step)
            editor = number
          }
        } else {
          editor = group.add(backing, key)
        }
        editor.name(control.label ?? key)
        editors.push(editor)

        const fullPath = [...path, key]
        editor.onChange((value) => {
          if (!active) return
          const next = readValue(entry, value)
          valuesRef.current = setIn(valuesRef.current, fullPath, next) as ControlValues<S>
          setValues(valuesRef.current)
          invalidate()

          let node: ControlSchema | undefined = schemaRef.current
          for (let i = 0; i < fullPath.length - 1 && node; i++) {
            node = (node[fullPath[i]] as Folder<any> | undefined)?.schema
          }
          ;(node?.[key] as Control<any> | undefined)?.onChange?.(next)
        })
      }
    }

    populate(root, schemaRef.current, valuesRef.current, [])

    if (collapsed) root.close()

    parameters.show()

    return () => {
      active = false
      rootRef.current = null
      for (const editor of editors) editor.onChange(() => {})
      parameters.paramList.remove(root.paramList)
      const index = parameters.groups.indexOf(root)
      if (index !== -1) parameters.groups.splice(index, 1)
    }
  }, [inspector, invalidate])

  useEffect(() => {
    rootRef.current?.name(title ?? 'Controls')
  }, [title, inspector])

  useEffect(() => {
    const root = rootRef.current
    if (collapsed) root?.close()
    else if (root && !root.paramList.isOpen) root.paramList.toggle()
  }, [collapsed, inspector])

  return values
}
