import type { Playbook } from './core/dsl';
import { PRODUCT_PLAYBOOK_V1 } from './salon/product.v1';
import { GRADING_JOB_PLAYBOOK_V1 } from './jewelry/grading_job.v1';

export const playbookRegistry: Record<string, Playbook> = {
  [PRODUCT_PLAYBOOK_V1.id]: PRODUCT_PLAYBOOK_V1,
  [GRADING_JOB_PLAYBOOK_V1.id]: GRADING_JOB_PLAYBOOK_V1,
};

// Lookup by entity smart code → versioned playbook
export function resolvePlaybook(entitySmartCode: string): Playbook | undefined {
  // Simple example: map ENTITY smart code to playbook by convention
  // e.g. HERA.SALON.PRODUCT.ENTITY.ITEM.v1 → HERA.SALON.PRODUCT.PLAYBOOK.v1
  const parts = entitySmartCode.split('.');
  const version = parts.at(-1) as `v${number}`;
  const family = parts.slice(0, parts.length - 3).join('.'); // HERA.SALON.PRODUCT
  const id = `${family}.PLAYBOOK.${version}`;
  return playbookRegistry[id];
}