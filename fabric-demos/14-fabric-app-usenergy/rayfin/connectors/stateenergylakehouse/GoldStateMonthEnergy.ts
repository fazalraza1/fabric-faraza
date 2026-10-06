import { entity, decimal, int, role, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

@role('authenticated', ['read'])
@entity()
export class GoldStateMonthEnergy extends Source({
  schema: 'gold',
  table: 'gold_state_month_energy',
  primaryKey: [],
}) {
  @text({ optional: true, max: 2048 })
  period?: string;

  @text({ optional: true, column: 'state_code', max: 8000 })
  stateCode?: string;

  @text({ optional: true, column: 'state_name', max: 8000 })
  stateName?: string;

  @text({ optional: true, column: 'fuel_code', max: 8000 })
  fuelCode?: string;

  @text({ optional: true, column: 'fuel_name', max: 8000 })
  fuelName?: string;

  @text({ optional: true, column: 'fuel_category', max: 8000 })
  fuelCategory?: string;

  @decimal({ optional: true, column: 'generation_mwh' })
  generationMwh?: number;

  @decimal({ optional: true, column: 'consumption_for_eg_btu' })
  consumptionForEgBtu?: number;

  @decimal({ optional: true, column: 'consumption_for_eg_mmbtu' })
  consumptionForEgMmbtu?: number;

  @decimal({ optional: true, column: 'generation_mix_pct' })
  generationMixPct?: number;

  @decimal({ optional: true, column: 'fuel_intensity_mmbtu_per_mwh' })
  fuelIntensityMmbtuPerMwh?: number;

  @int({ optional: true })
  population?: number;

  @decimal({ optional: true, column: 'generation_mwh_per_1000_residents' })
  generationMwhPer1000Residents?: number;

  @text({ optional: true, column: 'value_status', max: 8000 })
  valueStatus?: string;

  @text({ optional: true, max: 8000 })
  source?: string;

  @text({ optional: true, column: 'generation_unit', max: 8000 })
  generationUnit?: string;

  @text({ optional: true, column: 'consumption_unit', max: 8000 })
  consumptionUnit?: string;
}
