import { date, entity, role, set, text, uuid } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*', {
  policy: (claims, item) => claims.sub.eq(item.owner_id),
})
export class ActionItem {
  @uuid() id!: string;
  @text({ min: 1, max: 160 }) title!: string;
  @text({ min: 1, max: 120 }) scenarioName!: string;
  @set('High', 'Medium', 'Low') priority!: 'High' | 'Medium' | 'Low';
  @set('Open', 'In progress', 'Complete') status!: 'Open' | 'In progress' | 'Complete';
  @date({ optional: true }) dueDate?: Date;
  @date() createdAt!: Date;
  @text({ max: 200 }) owner_id!: string;
}
