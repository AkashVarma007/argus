export type ViolationId =
  | 'T-01' | 'T-03' | 'T-05' | 'T-07' | 'T-12' | 'T-13'
  | 'J-01' | 'J-02' | 'J-03' | 'J-04' | 'J-05' | 'J-06' | 'J-07' | 'J-08' | 'J-09'
  | 'L-01' | 'L-02' | 'L-04' | 'L-06' | 'L-09'
  | 'C-01' | 'C-02' | 'C-03' | 'C-04' | 'C-05' | 'C-06'
  | 'TL-01' | 'TL-02' | 'TL-05' | 'TL-08' | 'TL-09'
  | 'R-01' | 'R-04' | 'R-07'
  | 'P-01' | 'P-04'
  | 'SMP-01' | 'SMP-02'
  | 'EL-01' | 'EL-02'
  | 'U-01' | 'U-04' | 'U-08'
  | 'AUTH-01' | 'AUTH-02' | 'AUTH-03' | 'AUTH-10'
  | 'S-01' | 'S-04'
  | 'TK-01' | 'TK-02'
  | 'H-01' | 'H-02' | 'H-08'
  | 'RC-01' | 'RC-02' | 'RC-03'
  | 'DISC-01' | 'DISC-02'
  | 'SL-01' | 'SL-02'
  | 'SUB-01' | 'SUB-02'
  | 'CACHE-01' | 'CACHE-05'
  | 'MRTR-01' | 'MRTR-03'

export interface ViolationConfig {
  violations: Set<ViolationId>
}

export function has(cfg: ViolationConfig, id: ViolationId): boolean {
  return cfg.violations.has(id)
}
