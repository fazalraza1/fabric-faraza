import { entity, date, decimal, int, role, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

@role('authenticated', ['read'])
@entity()
export class GoldDataFreshness extends Source({
  schema: 'gold',
  table: 'gold_data_freshness',
  primaryKey: [],
}) {
  @text({ optional: true, column: 'dataset_name', max: 8000 })
  datasetName?: string;

  @text({ optional: true, max: 8000 })
  source?: string;

  @text({ optional: true, column: 'latest_available_period', max: 8000 })
  latestAvailablePeriod?: string;

  @text({ optional: true, column: 'latest_selected_period', max: 8000 })
  latestSelectedPeriod?: string;

  @text({ optional: true, column: 'earliest_selected_period', max: 8000 })
  earliestSelectedPeriod?: string;

  @date({ optional: true, column: 'retrieved_at_utc' })
  retrievedAtUtc?: Date;

  @int({ optional: true, column: 'expected_jurisdictions' })
  expectedJurisdictions?: number;

  @int({ optional: true, column: 'actual_jurisdictions' })
  actualJurisdictions?: number;

  @decimal({ optional: true, column: 'completeness_pct' })
  completenessPct?: number;

  @text({ optional: true, max: 8000 })
  status?: string;

  @text({ optional: true, max: 8000 })
  notes?: string;
}
