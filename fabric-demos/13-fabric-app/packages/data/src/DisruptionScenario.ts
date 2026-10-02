import { date, entity, int, role, set, text, uuid } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*', {
  policy: (claims, item) => claims.sub.eq(item.owner_id),
})
export class DisruptionScenario {
  @uuid() id!: string;
  @text({ min: 1, max: 120 }) name!: string;
  @text({ min: 1, max: 80 }) region!: string;
  @set('Grid constraint', 'Port closure', 'Trade restriction', 'Severe weather')
  eventType!: 'Grid constraint' | 'Port closure' | 'Trade restriction' | 'Severe weather';
  @int() severity!: number;
  @int() durationDays!: number;
  @int() projectedRisk!: number;
  @set('Draft', 'Active', 'Closed') status!: 'Draft' | 'Active' | 'Closed';
  @date() createdAt!: Date;
  @text({ max: 200 }) owner_id!: string;
}
