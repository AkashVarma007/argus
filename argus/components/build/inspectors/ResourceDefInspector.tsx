import type { ResourceDef } from '@/lib/store/types'
import { TextField, TextAreaField } from './Field'

interface ResourceDefInspectorProps {
  value: ResourceDef
  onChange: (next: ResourceDef) => void
}

export function ResourceDefInspector({ value, onChange }: ResourceDefInspectorProps) {
  const set = (patch: Partial<ResourceDef>) => onChange({ ...value, ...patch })
  return (
    <>
      <TextField
        label="URI"
        value={value.uri}
        placeholder="file:///path/to/resource"
        hint="Stable identifier the client will request."
        onChange={(v) => set({ uri: v })}
      />
      <TextField
        label="MIME type"
        value={value.mimeType}
        placeholder="text/plain"
        onChange={(v) => set({ mimeType: v })}
      />
      <TextAreaField
        label="Description"
        value={value.description}
        rows={3}
        placeholder="What this resource exposes."
        onChange={(v) => set({ description: v })}
      />
    </>
  )
}
