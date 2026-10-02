export type EventType =
  | 'Grid constraint'
  | 'Port closure'
  | 'Trade restriction'
  | 'Severe weather';

export interface DisruptionScenarioRecord {
  id: string;
  name: string;
  region: string;
  eventType: EventType;
  severity: number;
  durationDays: number;
  projectedRisk: number;
  status: 'Draft' | 'Active' | 'Closed';
  createdAt: Date;
  owner_id: string;
}

export interface ActionItemRecord {
  id: string;
  title: string;
  scenarioName: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In progress' | 'Complete';
  dueDate?: Date;
  createdAt: Date;
  owner_id: string;
}

export type UniversalAppSchema = {
  DisruptionScenario: DisruptionScenarioRecord;
  ActionItem: ActionItemRecord;
};
