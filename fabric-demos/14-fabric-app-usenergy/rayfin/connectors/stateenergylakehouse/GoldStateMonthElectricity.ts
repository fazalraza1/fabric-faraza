import { entity, decimal, int, role, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

@role('authenticated', ['read'])
@entity()
export class GoldStateMonthElectricity extends Source({
  schema: 'gold',
  table: 'gold_state_month_electricity',
  primaryKey: [],
}) {
  @text({ optional: true, max: 2048 })
  period?: string;

  @text({ optional: true, column: 'state_code', max: 8000 })
  stateCode?: string;

  @text({ optional: true, column: 'state_name', max: 8000 })
  stateName?: string;

  @int({ optional: true })
  population?: number;

  @decimal({ optional: true, column: 'generation_mwh' })
  generationMwh?: number;

  @decimal({ optional: true, column: 'retail_sales_mwh' })
  retailSalesMwh?: number;

  @decimal({ optional: true, column: 'generation_mwh_per_1000_residents' })
  generationMwhPer1000Residents?: number;

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

  @decimal({ optional: true, column: 'retail_sales_eight_month_high_mwh' })
  retailSalesEightMonthHighMwh?: number;

  @decimal({ optional: true, column: 'retail_sales_eight_month_low_mwh' })
  retailSalesEightMonthLowMwh?: number;

  @int({ optional: true, column: 'retail_sales_state_rank' })
  retailSalesStateRank?: number;

  @decimal({ optional: true, column: 'retail_sales_national_median_mwh' })
  retailSalesNationalMedianMwh?: number;

  @decimal({ optional: true, column: 'completeness_pct' })
  completenessPct?: number;

  @text({ optional: true, max: 8000 })
  source?: string;
}
