import JSZip from 'jszip'
import type { GeneratedProject } from './types'

export async function packZip(project: GeneratedProject): Promise<Blob> {
  const zip = new JSZip()
  const root = zip.folder(project.name)
  if (!root) throw new Error(`Failed to create root folder ${project.name}`)
  for (const file of project.files) {
    root.file(file.path, file.content)
  }
  return zip.generateAsync({ type: 'blob' })
}
