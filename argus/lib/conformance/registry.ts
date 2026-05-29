import type { Check, Category } from './types'
import T01 from './checks/transport/T-01.content-type-json/check'
import T03 from './checks/transport/T-03.response-content-type/check'
import T05 from './checks/transport/T-05.notification-202/check'
import T07 from './checks/transport/T-07.origin-validation/check'
import T12 from './checks/transport/T-12.protocol-version-header/check'
import T13 from './checks/transport/T-13.protocol-version-rejected/check'
import J01 from './checks/jsonrpc/J-01.jsonrpc-version/check'
import J02 from './checks/jsonrpc/J-02.id-echoed/check'
import J03 from './checks/jsonrpc/J-03.result-xor-error/check'
import J04 from './checks/jsonrpc/J-04.unknown-method/check'
import J05 from './checks/jsonrpc/J-05.parse-error/check'
import J06 from './checks/jsonrpc/J-06.invalid-params/check'
import J07 from './checks/jsonrpc/J-07.notification-no-response/check'
import J08 from './checks/jsonrpc/J-08.error-shape/check'
import J09 from './checks/jsonrpc/J-09.internal-error-code/check'
import L01 from './checks/lifecycle/L-01.initialize-result/check'
import L02 from './checks/lifecycle/L-02.server-info-types/check'
import L04 from './checks/lifecycle/L-04.protocol-version-echoed/check'
import L06 from './checks/lifecycle/L-06.initialized-notification/check'
import L09 from './checks/lifecycle/L-09.ping/check'
import C01 from './checks/capabilities/C-01.tools-list/check'
import C02 from './checks/capabilities/C-02.resources-list/check'
import C03 from './checks/capabilities/C-03.prompts-list/check'
import C04 from './checks/capabilities/C-04.logging-setlevel/check'
import C05 from './checks/capabilities/C-05.completion-complete/check'
import C06 from './checks/capabilities/C-06.undeclared-rejected/check'
import TL01 from './checks/tools/TL-01.tool-shape/check'
import TL02 from './checks/tools/TL-02.input-schema-valid/check'
import TL05 from './checks/tools/TL-05.unique-names/check'
import TL08 from './checks/tools/TL-08.missing-tool/check'
import TL09 from './checks/tools/TL-09.invalid-input/check'
import R01 from './checks/resources/R-01.resource-shape/check'
import R04 from './checks/resources/R-04.unknown-uri/check'
import R07 from './checks/resources/R-07.content-types/check'
import P01 from './checks/prompts/P-01.prompt-shape/check'
import P04 from './checks/prompts/P-04.get-arguments/check'
import SMP01 from './checks/sampling/SMP-01.declared-capability/check'
import SMP02 from './checks/sampling/SMP-02.back-request-shape/check'
import EL01 from './checks/elicitation/EL-01.declared-capability/check'
import EL02 from './checks/elicitation/EL-02.form-or-url/check'
import U01 from './checks/utilities/U-01.progress-tokens/check'
import U04 from './checks/utilities/U-04.cancellation/check'
import U08 from './checks/utilities/U-08.logging-levels/check'
import AUTH01 from './checks/authorization/AUTH-01.unauthenticated-401/check'
import AUTH02 from './checks/authorization/AUTH-02.www-authenticate-resource/check'
import AUTH03 from './checks/authorization/AUTH-03.protected-resource-metadata/check'
import AUTH10 from './checks/authorization/AUTH-10.no-url-token/check'
import S01 from './checks/security/S-01.origin-validation/check'
import S04 from './checks/security/S-04.tls-required/check'
import TK01 from './checks/tasks/TK-01.task-support-declared/check'
import TK02 from './checks/tasks/TK-02.task-status-poll/check'
import H01 from './checks/hygiene/H-01.error-messages-helpful/check'
import H02 from './checks/hygiene/H-02.consistent-types/check'
import H08 from './checks/hygiene/H-08.no-stack-traces/check'
import RC01 from './checks/rc/RC-01.draft-2026-v1-supported/check'
import RC02 from './checks/rc/RC-02.icons-typed/check'
import RC03 from './checks/rc/RC-03.url-mode-elicitation/check'
import DISC01 from './checks/discovery/DISC-01.well-known-mcp/check'
import DISC02 from './checks/discovery/DISC-02.cors-preflight/check'
import SL01 from './checks/stateless/SL-01.no-session-cookie/check'
import SL02 from './checks/stateless/SL-02.identical-result-after-reconnect/check'
import SUB01 from './checks/subscriptions/SUB-01.resource-subscribe/check'
import SUB02 from './checks/subscriptions/SUB-02.unsubscribe-stops-events/check'
import CACHE01 from './checks/caching/CACHE-01.list-stable-without-changed/check'
import CACHE05 from './checks/caching/CACHE-05.list-changed-after-touch/check'
import MRTR01 from './checks/mrtr/MRTR-01.metadata-shape/check'
import MRTR03 from './checks/mrtr/MRTR-03.transport-spec/check'

const _checks: Check[] = []

export function registerChecks(...checks: Check[]): void {
  for (const c of checks) {
    if (_checks.find((x) => x.id === c.id)) {
      throw new Error(`duplicate check id: ${c.id}`)
    }
    _checks.push(c)
  }
}

export function listChecks(): readonly Check[] {
  return _checks
}

export function getCheck(id: string): Check | undefined {
  return _checks.find((c) => c.id === id)
}

export function byCategory(): Record<Category, Check[]> {
  const out: Record<Category, Check[]> = {
    transport: [],
    jsonrpc: [],
    lifecycle: [],
    capabilities: [],
    tools: [],
    resources: [],
    prompts: [],
    sampling: [],
    elicitation: [],
    utilities: [],
    authorization: [],
    security: [],
    tasks: [],
    hygiene: [],
    rc: [],
    discovery: [],
    stateless: [],
    subscriptions: [],
    caching: [],
    mrtr: [],
  }
  for (const c of _checks) out[c.category].push(c)
  return out
}

registerChecks(T01, T03, T05, T07, T12, T13)
registerChecks(J01, J02, J03, J04, J05, J06, J07, J08, J09)
registerChecks(L01, L02, L04, L06, L09)
registerChecks(C01, C02, C03, C04, C05, C06)
registerChecks(TL01, TL02, TL05, TL08, TL09)
registerChecks(R01, R04, R07)
registerChecks(P01, P04)
registerChecks(SMP01, SMP02)
registerChecks(EL01, EL02)
registerChecks(U01, U04, U08)
registerChecks(AUTH01, AUTH02, AUTH03, AUTH10)
registerChecks(S01, S04)
registerChecks(TK01, TK02)
registerChecks(H01, H02, H08)
registerChecks(RC01, RC02, RC03)
registerChecks(DISC01, DISC02)
registerChecks(SL01, SL02)
registerChecks(SUB01, SUB02)
registerChecks(CACHE01, CACHE05, MRTR01, MRTR03)
