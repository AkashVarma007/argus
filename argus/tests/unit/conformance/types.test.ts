import { describe, it, expectTypeOf } from 'vitest'
import type {
  Check,
  CheckContext,
  CheckResult,
  Evidence,
  SpecVersion,
  Category,
  Severity,
  Confidence,
  SpecRef,
} from '@/lib/conformance/types'

describe('conformance/types', () => {
  it('exports SpecVersion literal union', () => {
    expectTypeOf<SpecVersion>().toEqualTypeOf<'2025-11-25' | 'DRAFT-2026-v1'>()
  })

  it('exports the 19 categories as a literal union', () => {
    const categories: Category[] = [
      'transport', 'jsonrpc', 'lifecycle', 'capabilities',
      'tools', 'resources', 'prompts',
      'sampling', 'elicitation', 'utilities',
      'authorization', 'security', 'tasks', 'hygiene',
      'rc', 'discovery', 'stateless', 'subscriptions', 'caching', 'mrtr',
    ]
    expectTypeOf(categories[0]).toEqualTypeOf<Category>()
  })

  it('Check has the documented shape', () => {
    expectTypeOf<Check['id']>().toBeString()
    expectTypeOf<Check['severity']>().toEqualTypeOf<Severity>()
    expectTypeOf<Check['confidence']>().toEqualTypeOf<Confidence>()
    expectTypeOf<Check['appliesTo']>().toEqualTypeOf<SpecVersion[]>()
    expectTypeOf<Check['deterministic']>().toBeBoolean()
  })

  it('CheckResult.status is a literal union', () => {
    expectTypeOf<CheckResult['status']>().toEqualTypeOf<'pass' | 'fail' | 'skip' | 'error'>()
  })

  it('Evidence may carry request/response/curl', () => {
    expectTypeOf<Evidence['curlCommand']>().toEqualTypeOf<string | undefined>()
  })

  it('SpecRef carries the cited section + verbatim quote', () => {
    expectTypeOf<SpecRef['url']>().toBeString()
    expectTypeOf<SpecRef['section']>().toBeString()
    expectTypeOf<SpecRef['quote']>().toBeString()
  })

  it('CheckContext exposes client, rawHttp, spec, capabilities, log', () => {
    expectTypeOf<CheckContext['spec']>().toEqualTypeOf<SpecVersion>()
    expectTypeOf<CheckContext['log']>().toBeFunction()
  })
})
