import type { ServerMeta } from '@/lib/store/types'
import { TextField, TextAreaField } from './Field'

interface ServerMetaInspectorProps {
  value: ServerMeta
  onChange: (next: ServerMeta) => void
}

export function ServerMetaInspector({ value, onChange }: ServerMetaInspectorProps) {
  const set = (patch: Partial<ServerMeta>) => onChange({ ...value, ...patch })
  return (
    <>
      <TextField
        label="Name"
        value={value.name}
        placeholder="my-server"
        onChange={(v) => set({ name: v })}
      />
      <TextField
        label="Version"
        value={value.version}
        placeholder="0.1.0"
        hint="Semantic version: MAJOR.MINOR.PATCH"
        onChange={(v) => set({ version: v })}
      />
      <TextField
        label="License"
        value={value.license}
        placeholder="MIT"
        onChange={(v) => set({ license: v })}
      />
      <TextAreaField
        label="Description"
        value={value.description}
        placeholder="What this server does."
        rows={3}
        onChange={(v) => set({ description: v })}
      />
    </>
  )
}
