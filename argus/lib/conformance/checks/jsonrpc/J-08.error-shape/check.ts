import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'J-08',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Error object has integer code and string message',
  probe: 'Trigger an error response and verify the error object shape',
  criterion: 'error.code is an integer and error.message is a string',
  specRef: {
    url: 'https://www.jsonrpc.org/specification#error_object',
    section: '§ 5.1 Error object',
    quote: 'code: A Number that indicates the error type. message: A String providing a short description.',
  },
  async run(ctx) {
    const tStart = performance.now()
    const { error, raw } = await ctx.client.call('nonexistent/method', {})
    const durationMs = performance.now() - tStart
    const evidence = {
      response: { body: raw },
      expected: { 'error.code': 'integer', 'error.message': 'string' },
      actual: error
        ? { 'error.code': error.code, 'error.codeType': typeof error.code, 'error.messageType': typeof error.message }
        : null,
    }
    if (!error) {
      return {
        checkId: 'J-08',
        status: 'fail',
        message: 'Expected an error response but got result.',
        durationMs,
        evidence,
      }
    }
    const codeOk = Number.isInteger(error.code)
    const messageOk = typeof error.message === 'string'
    if (codeOk && messageOk) {
      return { checkId: 'J-08', status: 'pass', durationMs, evidence }
    }
    const problems: string[] = []
    if (!codeOk) problems.push(`error.code is ${typeof error.code} (expected integer)`)
    if (!messageOk) problems.push(`error.message is ${typeof error.message} (expected string)`)
    return {
      checkId: 'J-08',
      status: 'fail',
      message: problems.join('; '),
      durationMs,
      evidence,
    }
  },
}

export default check
