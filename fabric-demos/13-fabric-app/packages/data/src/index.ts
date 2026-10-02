import { ActionItem } from './ActionItem.js';
import { DisruptionScenario } from './DisruptionScenario.js';
import type { UniversalAppSchema } from '@rayfin-app/shared';

export type { UniversalAppSchema };
export { ActionItem, DisruptionScenario };

export const schema = [DisruptionScenario, ActionItem];
