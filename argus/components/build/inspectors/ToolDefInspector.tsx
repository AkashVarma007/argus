import type { ToolDef } from '@/lib/store/types'
import { TextField, TextAreaField } from './Field'
import { SchemaEditor } from '../SchemaEditor'

interface ToolDefInspectorProps {
  value: ToolDef
  onChange: (next: ToolDef) => void
}

export function ToolDefInspector({ value, onChange }: ToolDefInspectorProps) {
  const set = (patch: Partial<ToolDef>) => onChange({ ...value, ...patch })
  return (
    <>
      <TextField
        label="Name"
        value={value.name}
        placeholder="my-tool"
        onChange={(v) => set({ name: v })}
      />
      <TextAreaField
        label="Description"
        value={value.description}
        rows={3}
        placeholder="What this tool does for the model."
        onChange={(v) => set({ description: v })}
      />
      <SchemaEditor
        label="Input schema"
        value={value.inputSchema}
        onChange={(next) => set({ inputSchema: next })}
      />
    </>
  )
}
