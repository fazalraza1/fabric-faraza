import { entity, date, int, role, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

@role('authenticated', ['read'])
@entity()
export class GoldStatePopulation extends Source({
  schema: 'gold',
  table: 'gold_state_population',
  primaryKey: [],
}) {
  @text({ optional: true, column: 'state_code', max: 8000 })
  stateCode?: string;

  @text({ optional: true, column: 'state_name', max: 8000 })
  stateName?: string;

  @text({ optional: true, column: 'census_state_fips', max: 8000 })
  censusStateFips?: string;

  @int({ optional: true })
  population?: number;

  @int({ optional: true, column: 'estimate_year' })
  estimateYear?: number;

  @text({ optional: true, max: 8000 })
  vintage?: string;

  @date({ optional: true, column: 'retrieved_at_utc' })
  retrievedAtUtc?: Date;
}
