import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  Database,
  Flame,
  MapPinned,
  Menu,
  Moon,
  PlugZap,
  Sun,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { VegaVisual, useCssTheme, type VisualizationSpec } from '@microsoft/fabric-visuals';
import type { DataTable } from '@microsoft/fabric-visuals-core';

import { useTheme } from '@/hooks/theme.context';
import type {
  EnergySnapshot,
  ExplorerPage,
  StateMonthElectricity,
} from '@/lib/energy-model';
import { getProviderSetupState } from '@/lib/energy-provider';
import { energyProviderRegistration } from '@/lib/energy-provider.registration';

const navigation: { id: ExplorerPage; label: string; icon: typeof Activity }[] = [
  { id: 'national', label: 'National overview', icon: Zap },
  { id: 'trends', label: '8-month trends', icon: TrendingUp },
  { id: 'comparison', label: 'State comparison', icon: BarChart3 },
  { id: 'state', label: 'State detail', icon: MapPinned },
  { id: 'fuel', label: 'Fuel detail', icon: Flame },
  { id: 'methodology', label: 'Methodology & quality', icon: BookOpenCheck },
];

const trendSpec: VisualizationSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  description: 'Eight-month national electricity retail sales trend',
  mark: { type: 'line', point: true },
  encoding: {
    x: { field: 'period', type: 'ordinal', title: 'Month', sort: 'ascending' },
    y: {
      field: 'retailSalesMwh',
      type: 'quantitative',
      title: 'Retail sales (MWh)',
      scale: { zero: false },
    },
    tooltip: [
      { field: 'period', type: 'ordinal', title: 'Month' },
      { field: 'retailSalesMwh', type: 'quantitative', title: 'Retail sales', format: ',.0f' },
      { field: 'retailSalesMomPct', type: 'quantitative', title: 'MoM', format: '.1f' },
    ],
  },
};

const stateComparisonSpec: VisualizationSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  description: 'State electricity consumption per person',
  mark: { type: 'bar', cornerRadiusEnd: 3 },
  encoding: {
    x: {
      field: 'electricityConsumptionKwhPerPerson',
      type: 'quantitative',
      title: 'Electricity consumption (kWh/person)',
    },
    y: { field: 'stateCode', type: 'nominal', title: null, sort: '-x' },
    color: {
      field: 'carbonFreeSharePct',
      type: 'quantitative',
      title: 'Carbon-free share (%)',
    },
    tooltip: [
      { field: 'stateName', type: 'nominal', title: 'State' },
      {
        field: 'electricityConsumptionKwhPerPerson',
        type: 'quantitative',
        title: 'kWh/person',
        format: ',.0f',
      },
      { field: 'carbonFreeSharePct', type: 'quantitative', title: 'Carbon-free', format: '.1f' },
    ],
  },
};

const fuelSpec: VisualizationSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  description: 'Generation mix by fuel',
  mark: { type: 'bar', cornerRadiusEnd: 3 },
  encoding: {
    x: { field: 'generationMwh', type: 'quantitative', title: 'Generation (MWh)' },
    y: { field: 'fuelName', type: 'nominal', title: null, sort: '-x' },
    color: { field: 'fuelCategory', type: 'nominal', title: 'Fuel category' },
    tooltip: [
      { field: 'fuelName', type: 'nominal', title: 'Fuel' },
      { field: 'generationMwh', type: 'quantitative', title: 'Generation', format: ',.0f' },
      { field: 'generationMixPct', type: 'quantitative', title: 'Mix', format: '.1f' },
      {
        field: 'fuelIntensityMmbtuPerMwh',
        type: 'quantitative',
        title: 'Intensity (MMBtu/MWh)',
        format: '.2f',
      },
    ],
  },
};

function App() {
  const [page, setPage] = useState<ExplorerPage>('national');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<EnergySnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(
    () => getProviderSetupState(energyProviderRegistration).configured,
  );
  const { isDark, toggleTheme } = useTheme();
  const visualTheme = useCssTheme();
  const setup = getProviderSetupState(energyProviderRegistration);

  useEffect(() => {
    if (!setup.configured || !energyProviderRegistration.provider) return;
    let active = true;
    energyProviderRegistration.provider
      .loadSnapshot()
      .then((value) => {
        if (active) setSnapshot(value);
      })
      .catch(() => {
        if (active) {
          setLoadError(
            'The Gold tables could not be read. Verify connector permissions, generated entities, and Lakehouse SQL endpoint availability.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setup.configured]);

  const currentLabel = navigation.find((item) => item.id === page)?.label ?? 'Explorer';
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={`${mobileOpen ? 'flex' : 'hidden'} fixed inset-0 z-30 w-full flex-col border-r border-border bg-card p-500 md:static md:flex md:w-72`}
        >
          <div className="flex items-start justify-between gap-300">
            <button type="button" className="text-left" onClick={() => setPage('national')}>
              <div className="mb-200 flex items-center gap-200 text-primary">
                <PlugZap className="icon-size-500" />
                <span className="text-200 font-bold uppercase tracking-widest">EIA + Census</span>
              </div>
              <h1 className="font-heading text-500 font-bold leading-500">
                U.S. State Energy Explorer
              </h1>
            </button>
            <button
              type="button"
              className="rounded-lg p-200 hover:bg-accent md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="icon-size-300" />
            </button>
          </div>

          <StatusBadge configured={setup.configured} />

          <nav className="mt-500 space-y-100" aria-label="Primary navigation">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPage(id);
                  setMobileOpen(false);
                }}
                className={`flex w-full items-center gap-300 rounded-lg px-300 py-300 text-left text-300 font-medium transition ${
                  page === id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="icon-size-300" />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto border-t border-border pt-400 text-200 text-muted-foreground">
            <p>Electric-power scope · latest 8 common months</p>
            <p className="mt-100">Protected by Fabric + Entra SSO</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-400 py-300 backdrop-blur md:px-700">
            <div className="flex items-center gap-300">
              <button
                type="button"
                className="rounded-lg p-200 hover:bg-accent md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="icon-size-300" />
              </button>
              <div>
                <p className="text-200 font-semibold uppercase tracking-widest text-primary">
                  Live Gold-data architecture
                </p>
                <h2 className="text-400 font-semibold">{currentLabel}</h2>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-border bg-card p-200 hover:bg-accent"
              onClick={toggleTheme}
              aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
            >
              {isDark ? <Sun className="icon-size-300" /> : <Moon className="icon-size-300" />}
            </button>
          </header>

          <div className="mx-auto max-w-7xl p-400 md:p-700">
            {loadError && <ErrorState message={loadError} />}
            {loading && <LoadingState />}
            {!loading && page !== 'methodology' && !snapshot && (
              <ConfigurationState setup={setup} />
            )}
            {!loading && snapshot && page !== 'methodology' && (
              <ExplorerPageView
                page={page}
                snapshot={snapshot}
                visualTheme={visualTheme}
              />
            )}
            {page === 'methodology' && <Methodology snapshot={snapshot} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function ExplorerPageView({
  page,
  snapshot,
  visualTheme,
}: {
  page: ExplorerPage;
  snapshot: EnergySnapshot;
  visualTheme: ReturnType<typeof useCssTheme>;
}) {
  const periods = useMemo(
    () => [...new Set(snapshot.nationalMonthSummary.map((row) => row.period))].sort(),
    [snapshot],
  );
  const states = useMemo(
    () =>
      [...new Map(snapshot.stateMonthElectricity.map((row) => [row.stateCode, row])).values()]
        .sort((a, b) => a.stateName.localeCompare(b.stateName)),
    [snapshot],
  );
  const fuels = useMemo(
    () =>
      [...new Map(snapshot.stateMonthEnergy.map((row) => [row.fuelCode, row])).values()]
        .sort((a, b) => a.fuelName.localeCompare(b.fuelName)),
    [snapshot],
  );
  const [period, setPeriod] = useState(periods.at(-1) ?? '');
  const [stateCode, setStateCode] = useState(states[0]?.stateCode ?? '');
  const [fuelCode, setFuelCode] = useState(fuels[0]?.fuelCode ?? '');

  const filters = (
    <FilterBar
      page={page}
      period={period}
      periods={periods}
      stateCode={stateCode}
      states={states}
      fuelCode={fuelCode}
      fuels={fuels}
      onPeriod={setPeriod}
      onState={setStateCode}
      onFuel={setFuelCode}
    />
  );

  if (page === 'national') {
    const row = snapshot.nationalMonthSummary.find((item) => item.period === period);
    return (
      <section>
        <PageHeading
          eyebrow="National pulse"
          title="A comparable view across every state and DC"
          description="Retail sales represent electricity consumption. Generation metrics use EIA electric-power operational data."
        />
        {filters}
        <FreshnessStrip rows={snapshot.dataFreshness} />
        {row ? (
          <>
            <div className="grid gap-300 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Generation" value={format(row.generationMwh, ' MWh')} />
              <Metric label="Retail sales" value={format(row.retailSalesMwh, ' MWh')} />
              <Metric
                label="Consumption per person"
                value={format(row.electricityConsumptionKwhPerPerson, ' kWh/person')}
              />
              <Metric
                label="Reporting coverage"
                value={`${row.reportingJurisdictions}/${row.expectedJurisdictions}`}
              />
            </div>
            <div className="mt-400 grid gap-400 lg:grid-cols-3">
              <ShareCard label="Carbon-free share" value={row.carbonFreeSharePct} />
              <ShareCard label="Fossil dependency" value={row.fossilDependencyPct} />
              <article className="rounded-2xl border border-border bg-card p-400">
                <p className="text-200 font-semibold uppercase tracking-wide text-muted-foreground">
                  Supply balance proxy
                </p>
                <p className="mt-300 font-numeric text-hero-800 font-bold">
                  {format(row.supplyBalanceProxy, '×', 2)}
                </p>
                <p className="mt-200 text-200 text-muted-foreground">
                  Generation ÷ retail sales. This is not a physical power-flow balance.
                </p>
              </article>
            </div>
          </>
        ) : (
          <EmptyState message="No complete national row is available for this month." />
        )}
      </section>
    );
  }

  if (page === 'trends') {
    const table = nationalTrendTable(snapshot);
    return (
      <section>
        <PageHeading
          eyebrow="Common reporting window"
          title="Eight complete months, selected dynamically"
          description="The pipeline intersects EIA operational and retail-sales availability before choosing the latest eight monthly periods."
        />
        <SourceBadge />
        <article className="mt-400 rounded-2xl border border-border bg-card p-400">
          <CardHeading
            title="National retail-sales trend"
            detail="MWh, with month-over-month change in the tooltip."
          />
          <div className="h-96">
            <VegaVisual
              spec={trendSpec}
              data={table}
              theme={visualTheme}
              onInteraction={() => {}}
              style={{ height: '100%' }}
            />
          </div>
        </article>
      </section>
    );
  }

  if (page === 'comparison') {
    const rows = snapshot.stateMonthElectricity.filter((row) => row.period === period);
    return (
      <section>
        <PageHeading
          eyebrow="State benchmark"
          title="Compare consumption, generation, and fuel dependence"
          description="Missing and suppressed values remain null and are never converted to zero."
        />
        {filters}
        {rows.length ? (
          <>
            <article className="rounded-2xl border border-border bg-card p-400">
              <CardHeading
                title="Electricity consumption per resident"
                detail="Compare every reporting jurisdiction on a common scale."
              />
              <div className="h-[36rem]">
                <VegaVisual
                  spec={stateComparisonSpec}
                  data={stateComparisonTable(rows)}
                  theme={visualTheme}
                  onInteraction={() => {}}
                  style={{ height: '100%' }}
                />
              </div>
            </article>
            <StateTable rows={rows} />
          </>
        ) : (
          <EmptyState message="No state rows are available for this month." />
        )}
      </section>
    );
  }

  if (page === 'state') {
    const row = snapshot.stateMonthElectricity.find(
      (item) => item.period === period && item.stateCode === stateCode,
    );
    return (
      <section>
        <PageHeading
          eyebrow="State profile"
          title={row?.stateName ?? 'State detail'}
          description="Ranks and the national median are computed within each selected monthly period."
        />
        {filters}
        {row ? <StateDetail row={row} /> : <EmptyState message="No row matches these filters." />}
      </section>
    );
  }

  const fuelRows = snapshot.stateMonthEnergy.filter(
    (row) => row.period === period && (fuelCode ? row.fuelCode === fuelCode : true),
  );
  const stateFuelRows = snapshot.stateMonthEnergy.filter(
    (row) => row.period === period && row.stateCode === stateCode,
  );
  return (
    <section>
      <PageHeading
        eyebrow="Fuel lens"
        title="Generation mix and thermal input intensity"
        description="Fuel intensity is consumption-for-electricity-generation MMBtu divided by generation MWh; non-combustible fuels may be null."
      />
      {filters}
      <div className="grid gap-400 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-400">
          <CardHeading title="Selected state generation mix" detail="MWh by EIA energy source." />
          <div className="h-96">
            <VegaVisual
              spec={fuelSpec}
              data={fuelTable(stateFuelRows)}
              theme={visualTheme}
              onInteraction={() => {}}
              style={{ height: '100%' }}
            />
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-card p-400">
          <CardHeading title="Selected fuel across states" detail="Reported values only." />
          <div className="space-y-200">
            {fuelRows
              .filter((row) => row.generationMwh != null)
              .sort((a, b) => (b.generationMwh ?? 0) - (a.generationMwh ?? 0))
              .slice(0, 12)
              .map((row) => (
                <div key={row.stateCode} className="flex justify-between border-b border-border pb-200">
                  <span>{row.stateName}</span>
                  <span className="font-numeric font-semibold">
                    {format(row.generationMwh, ' MWh')}
                  </span>
                </div>
              ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function ConfigurationState({
  setup,
}: {
  setup: ReturnType<typeof getProviderSetupState>;
}) {
  return (
    <section aria-labelledby="setup-title">
      <PageHeading
        eyebrow="Honest setup state"
        title="Connect the curated Lakehouse before exploring"
        description="Connector identifiers are intentionally absent. The app will not replace unavailable public data with demo numbers."
      />
      <article className="overflow-hidden rounded-2xl border border-primary/30 bg-card">
        <div className="grid gap-500 p-500 lg:grid-cols-[auto_1fr]">
          <div className="flex icon-size-700 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Database className="icon-size-400" />
          </div>
          <div>
            <h3 id="setup-title" className="font-heading text-600 font-bold">
              {setup.title}
            </h3>
            <p className="mt-200 max-w-3xl text-300 leading-500 text-muted-foreground">
              {setup.detail}
            </p>
            <ul className="mt-400 grid gap-200 sm:grid-cols-2">
              {[
                'Run Bronze → Silver → Gold notebooks',
                'Verify 51 jurisdictions for every selected month',
                'Add the verified fabric-sqlanalytics connector',
                'Generate only the five required Gold entities',
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-200 rounded-xl bg-muted p-300 text-300">
                  <span className="font-numeric font-bold text-primary">0{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            <p className="mt-400 text-200 text-muted-foreground">
              Missing: {setup.missing.join(', ')}. See README.md for exact placeholder commands.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

function Methodology({ snapshot }: { snapshot: EnergySnapshot | null }) {
  const definitions = [
    ['Generation per 1,000 residents', 'generation MWh ÷ Census population × 1,000'],
    ['Electricity consumption', 'EIA retail sales MWh × 1,000 ÷ population; units are kWh/person'],
    ['Generation mix', 'fuel generation MWh ÷ state total generation MWh × 100'],
    ['Fuel intensity', 'consumption-for-electricity-generation MMBtu ÷ generation MWh'],
    ['Carbon-free share', 'nuclear + renewable generation ÷ total generation × 100'],
    ['Fossil dependency', 'coal + petroleum + natural gas + other fossil generation ÷ total × 100'],
    ['Supply balance proxy', 'state generation MWh ÷ state retail sales MWh; not a power-flow balance'],
  ];
  return (
    <section>
      <PageHeading
        eyebrow="Definitions, lineage, caveats"
        title="Every metric keeps its source, units, and limitations"
        description="EIA data may be revised or suppressed. Census population is an annual estimate used across the eight-month reporting window."
      />
      <div className="grid gap-400 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-500">
          <CardHeading title="Metric definitions" detail="Gold-layer calculations." />
          <div className="space-y-300">
            {definitions.map(([name, formula]) => (
              <div key={name} className="border-b border-border pb-300 last:border-0">
                <p className="font-semibold">{name}</p>
                <p className="mt-100 text-200 text-muted-foreground">{formula}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-card p-500">
          <CardHeading title="Quality contract" detail="The pipeline fails closed." />
          <ul className="space-y-300 text-300 text-muted-foreground">
            <li>• Exactly the 50 states plus District of Columbia are expected.</li>
            <li>• Duplicate natural keys and negative reported values fail validation.</li>
            <li>• Suppressed and missing values remain null with a value-status flag.</li>
            <li>• The reporting window is the latest eight periods common to both EIA datasets.</li>
            <li>• Incomplete months are recorded in Gold freshness and block a “complete” status.</li>
          </ul>
          {snapshot ? <FreshnessStrip rows={snapshot.dataFreshness} /> : <SourceBadge />}
        </article>
      </div>
    </section>
  );
}

function FilterBar({
  page,
  period,
  periods,
  stateCode,
  states,
  fuelCode,
  fuels,
  onPeriod,
  onState,
  onFuel,
}: {
  page: ExplorerPage;
  period: string;
  periods: string[];
  stateCode: string;
  states: StateMonthElectricity[];
  fuelCode: string;
  fuels: EnergySnapshot['stateMonthEnergy'];
  onPeriod: (value: string) => void;
  onState: (value: string) => void;
  onFuel: (value: string) => void;
}) {
  return (
    <div className="mb-400 flex flex-wrap items-end gap-300 rounded-2xl border border-border bg-card p-300">
      {page !== 'trends' && (
        <Field label="Month">
          <select className="input" value={period} onChange={(event) => onPeriod(event.target.value)}>
            {periods.map((value) => <option key={value}>{value}</option>)}
          </select>
        </Field>
      )}
      {(page === 'state' || page === 'fuel') && (
        <Field label="State">
          <select className="input" value={stateCode} onChange={(event) => onState(event.target.value)}>
            {states.map((row) => <option key={row.stateCode} value={row.stateCode}>{row.stateName}</option>)}
          </select>
        </Field>
      )}
      {page === 'fuel' && (
        <Field label="Fuel">
          <select className="input" value={fuelCode} onChange={(event) => onFuel(event.target.value)}>
            {fuels.map((row) => <option key={row.fuelCode} value={row.fuelCode}>{row.fuelName}</option>)}
          </select>
        </Field>
      )}
      <SourceBadge />
    </div>
  );
}

function StateDetail({ row }: { row: StateMonthElectricity }) {
  return (
    <div className="grid gap-300 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Generation per 1,000 residents" value={format(row.generationMwhPer1000Residents, ' MWh')} />
      <Metric label="Consumption per person" value={format(row.electricityConsumptionKwhPerPerson, ' kWh')} />
      <Metric label="State retail-sales rank" value={row.retailSalesStateRank?.toString() ?? 'Not available'} />
      <Metric label="National median retail sales" value={format(row.retailSalesNationalMedianMwh, ' MWh')} />
      <Metric label="Carbon-free share" value={format(row.carbonFreeSharePct, '%', 1)} />
      <Metric label="Fossil dependency" value={format(row.fossilDependencyPct, '%', 1)} />
      <Metric label="Supply balance proxy" value={format(row.supplyBalanceProxy, '×', 2)} />
      <Metric label="Month-over-month" value={format(row.retailSalesMomPct, '%', 1)} />
      <Metric label="8-month high" value={format(row.retailSalesEightMonthHighMwh, ' MWh')} />
      <Metric label="8-month low" value={format(row.retailSalesEightMonthLowMwh, ' MWh')} />
    </div>
  );
}

function StateTable({ rows }: { rows: StateMonthElectricity[] }) {
  return (
    <div className="mt-400 overflow-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-3xl text-left text-300">
        <thead className="bg-muted text-200 uppercase tracking-wide text-muted-foreground">
          <tr>{['State', 'Retail sales', 'kWh/person', 'Carbon-free', 'Fossil', 'Coverage'].map((label) => <th key={label} className="px-400 py-300">{label}</th>)}</tr>
        </thead>
        <tbody>
          {[...rows].sort((a, b) => a.stateName.localeCompare(b.stateName)).map((row) => (
            <tr key={row.stateCode} className="border-t border-border">
              <td className="px-400 py-300 font-semibold">{row.stateName}</td>
              <td className="px-400 py-300 font-numeric">{format(row.retailSalesMwh, ' MWh')}</td>
              <td className="px-400 py-300 font-numeric">{format(row.electricityConsumptionKwhPerPerson, '')}</td>
              <td className="px-400 py-300 font-numeric">{format(row.carbonFreeSharePct, '%', 1)}</td>
              <td className="px-400 py-300 font-numeric">{format(row.fossilDependencyPct, '%', 1)}</td>
              <td className="px-400 py-300 font-numeric">{format(row.completenessPct, '%', 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FreshnessStrip({ rows }: { rows: EnergySnapshot['dataFreshness'] }) {
  return (
    <div className="my-400 flex flex-wrap gap-200">
      {rows.map((row) => (
        <span key={row.datasetName} className="rounded-full border border-border bg-card px-300 py-200 text-200">
          <strong>{row.datasetName}</strong> · through {row.latestAvailablePeriod ?? 'unknown'} · {format(row.completenessPct, '%', 1)}
        </span>
      ))}
    </div>
  );
}

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <div className={`mt-400 rounded-xl border p-300 ${configured ? 'border-primary/30 bg-primary/5' : 'border-warning/40 bg-warning/5'}`}>
      <p className="text-200 font-semibold">{configured ? 'GOLD DATA CONNECTED' : 'CONFIGURATION REQUIRED'}</p>
      <p className="mt-100 text-200 text-muted-foreground">{configured ? 'Live Lakehouse SQL endpoint' : 'No sample values displayed'}</p>
    </div>
  );
}

function SourceBadge() {
  return <span className="ml-auto rounded-full border border-border bg-muted px-300 py-200 text-200 text-muted-foreground">EIA Open Data v2 · Census PEP Vintage 2025</span>;
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-600 max-w-4xl"><p className="text-200 font-bold uppercase tracking-widest text-primary">{eyebrow}</p><h2 className="mt-200 font-heading text-hero-800 font-bold leading-hero-800 md:text-hero-900 md:leading-hero-900">{title}</h2><p className="mt-300 text-400 leading-600 text-muted-foreground">{description}</p></div>;
}

function CardHeading({ title, detail }: { title: string; detail: string }) {
  return <div className="mb-400"><h3 className="text-400 font-semibold">{title}</h3><p className="mt-100 text-200 text-muted-foreground">{detail}</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="rounded-2xl border border-border bg-card p-400"><p className="text-200 font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-300 font-numeric text-500 font-bold">{value}</p></article>;
}

function ShareCard({ label, value }: { label: string; value: number | null }) {
  return <article className="rounded-2xl border border-border bg-card p-400"><p className="text-200 font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-300 font-numeric text-hero-800 font-bold">{format(value, '%', 1)}</p><div className="mt-300 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(Math.max(value ?? 0, 0), 100)}%` }} /></div></article>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="min-w-52 space-y-100 text-200 font-semibold text-muted-foreground"><span>{label}</span>{children}</label>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-700 text-center text-300 text-muted-foreground">{message}</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div role="alert" className="mb-400 rounded-xl border border-destructive/40 bg-destructive/5 p-400 text-300 text-destructive">{message}</div>;
}

function LoadingState() {
  return <div className="rounded-2xl border border-border bg-card p-700 text-center text-300 text-muted-foreground">Connecting to curated Gold tables…</div>;
}

function format(value: number | null | undefined, suffix: string, digits = 0): string {
  return value == null ? 'Not reported' : `${value.toLocaleString('en-US', { maximumFractionDigits: digits })}${suffix}`;
}

function nationalTrendTable(snapshot: EnergySnapshot): DataTable {
  return {
    columns: [
      { name: 'period', displayName: 'Month' },
      { name: 'retailSalesMwh', displayName: 'Retail sales (MWh)', format: ',.0f' },
      { name: 'retailSalesMomPct', displayName: 'Month-over-month (%)', format: '.1f' },
    ],
    rows: snapshot.nationalMonthSummary.map((row) => [row.period, row.retailSalesMwh, row.retailSalesMomPct]),
  };
}

function stateComparisonTable(rows: StateMonthElectricity[]): DataTable {
  return {
    columns: [
      { name: 'stateCode', displayName: 'State code' },
      { name: 'stateName', displayName: 'State' },
      { name: 'electricityConsumptionKwhPerPerson', displayName: 'Consumption (kWh/person)', format: ',.0f' },
      { name: 'carbonFreeSharePct', displayName: 'Carbon-free share (%)', format: '.1f' },
    ],
    rows: rows.map((row) => [row.stateCode, row.stateName, row.electricityConsumptionKwhPerPerson, row.carbonFreeSharePct]),
  };
}

function fuelTable(rows: EnergySnapshot['stateMonthEnergy']): DataTable {
  return {
    columns: [
      { name: 'fuelName', displayName: 'Fuel' },
      { name: 'fuelCategory', displayName: 'Category' },
      { name: 'generationMwh', displayName: 'Generation (MWh)', format: ',.0f' },
      { name: 'generationMixPct', displayName: 'Generation mix (%)', format: '.1f' },
      { name: 'fuelIntensityMmbtuPerMwh', displayName: 'Fuel intensity (MMBtu/MWh)', format: '.2f' },
    ],
    rows: rows.map((row) => [row.fuelName, row.fuelCategory, row.generationMwh, row.generationMixPct, row.fuelIntensityMmbtuPerMwh]),
  };
}

export default App;
