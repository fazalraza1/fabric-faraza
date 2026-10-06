import { entity, decimal, int, role, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

@role('authenticated', ['read'])
@entity()
export class GoldNationalMonthSummary extends Source({
  schema: 'gold',
  table: 'gold_national_month_summary',
  primaryKey: [],
}) {
  @text({ optional: true, max: 2048 })
  period?: string;

  @int({ optional: true })
  population?: number;

  @decimal({ optional: true, column: 'generation_mwh' })
  generationMwh?: number;

  @decimal({ optional: true, column: 'retail_sales_mwh' })
  retailSalesMwh?: number;

  @decimal({ optional: true, column: 'electricity_consumption_kwh_per_person' })
  electricityConsumptionKwhPerPerson?: number;

  @decimal({ optional: true, column: 'carbon_free_share_pct' })
  carbonFreeSharePct?: number;

  @decimal({ optional: true, column: 'fossil_dependency_pct' })
  fossilDependencyPct?: number;

  @decimal({ optional: true, column: 'supply_balance_proxy' })
  supplyBalanceProxy?: number;

  @decimal({ optional: true, column: 'retail_sales_mom_pct' })
  retailSalesMomPct?: number;

  @int({ optional: true, column: 'reporting_jurisdictions' })
  reportingJurisdictions?: number;

  @int({ optional: true, column: 'expected_jurisdictions' })
  expectedJurisdictions?: number;

  @decimal({ optional: true, column: 'completeness_pct' })
  completenessPct?: number;

  @text({ optional: true, max: 8000 })
  source?: string;
}
