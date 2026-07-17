export default async function globalTeardown() {
  const bridge = globalThis.__argusE2EBridge?.proc
  if (!bridge || bridge.killed) return
  bridge.kill('SIGTERM')
  await new Promise<void>((resolve) => bridge.once('exit', () => resolve()))
}
