import { useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  BookOpen,
  Boxes,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Factory,
  Menu,
  Moon,
  Plus,
  ShieldAlert,
  Sun,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { VegaVisual, useCssTheme, type VisualizationSpec } from '@microsoft/fabric-visuals';
import type { DataTable, InteractionEvent } from '@microsoft/fabric-visuals-core';
import type {
  ActionItemRecord,
  DisruptionScenarioRecord,
  EventType,
} from '@rayfin-app/shared';

import {
  generationMix,
  monthlyEnergy,
  rankedRegions,
  regions,
  sourceNotes,
  tradeDependencies,
} from '@/data/synthetic-data';
import { useTheme } from '@/hooks/theme.context';
import { useCrud } from '@/components/useCrud';
import { getRayfinClient } from '@/lib/rayfin-client';
import { projectScenarioRisk, riskBand } from '@/lib/risk-score';

type Page = 'overview' | 'regions' | 'energy' | 'trade' | 'scenarios' | 'dictionary';

const navigation: { id: Page; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Executive overview', icon: CircleGauge },
  { id: 'regions', label: 'Regional risk', icon: ShieldAlert },
  { id: 'energy', label: 'Energy conditions', icon: Zap },
  { id: 'trade', label: 'Trade dependencies', icon: Factory },
  { id: 'scenarios', label: 'Disruption cases', icon: Boxes },
  { id: 'dictionary', label: 'Data dictionary', icon: BookOpen },
];

const riskSpec: VisualizationSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  description: 'Synthetic resilience risk by region',
  mark: { type: 'bar', cornerRadiusEnd: 4 },
  encoding: {
    x: { field: 'riskScore', type: 'quantitative', title: 'Composite risk score', scale: { domain: [0, 100] } },
    y: { field: 'region', type: 'nominal', title: null, sort: '-x' },
    color: { field: 'riskBand', type: 'nominal', title: 'Risk band' },
    tooltip: [
      { field: 'region', type: 'nominal', title: 'Region' },
      { field: 'riskScore', type: 'quantitative', title: 'Risk score' },
      { field: 'riskBand', type: 'nominal', title: 'Band' },
    ],
  },
};

const energySpec: VisualizationSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  description: 'Synthetic monthly electricity demand trend',
  mark: { type: 'line', point: true },
  encoding: {
    x: { field: 'month', type: 'ordinal', title: '2025 month' },
    y: { field: 'demandGw', type: 'quantitative', title: 'Demand (GW)', scale: { zero: false } },
    tooltip: [
      { field: 'month', type: 'ordinal', title: 'Month' },
      { field: 'demandGw', type: 'quantitative', title: 'Demand (GW)' },
      { field: 'priceMwh', type: 'quantitative', title: 'Price ($/MWh)' },
    ],
  },
};

const riskTable: DataTable = {
  columns: [
    { name: 'region', displayName: 'Region' },
    { name: 'riskScore', displayName: 'Risk score', format: '0' },
    { name: 'riskBand', displayName: 'Risk band' },
  ],
  rows: rankedRegions.map((item) => [item.region, item.riskScore, riskBand(item.riskScore)]),
};

const energyTable: DataTable = {
  columns: [
    { name: 'month', displayName: 'Month' },
    { name: 'demandGw', displayName: 'Demand (GW)', format: '0.0' },
    { name: 'priceMwh', displayName: 'Price ($/MWh)', format: '$0' },
  ],
  rows: monthlyEnergy.map((item) => [item.month, item.demandGw, item.priceMwh]),
};

function getOwnerId(client: Awaited<ReturnType<typeof getRayfinClient>>): string {
  const session = client.auth.getSession();
  if (!session.isAuthenticated || !session.user) throw new Error('Sign in before managing scenarios.');
  return session.user.id;
}

function App() {
  const [page, setPage] = useState<Page>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(rankedRegions[0].region);
  const { isDark, toggleTheme } = useTheme();
  const visualTheme = useCssTheme();

  const scenarioApi = useMemo(() => ({
    list: async () => {
      const client = await getRayfinClient();
      return client.data.DisruptionScenario.select([
        'id', 'name', 'region', 'eventType', 'severity', 'durationDays',
        'projectedRisk', 'status', 'createdAt', 'owner_id',
      ]).orderBy({ createdAt: 'desc' }).execute();
    },
    create: async (input: Omit<DisruptionScenarioRecord, 'id'>) =>
      (await getRayfinClient()).data.DisruptionScenario.create(input),
    update: async (id: string, patch: Partial<Omit<DisruptionScenarioRecord, 'id'>>) =>
      (await getRayfinClient()).data.DisruptionScenario.update({ id }, patch),
    remove: async (id: string) => {
      await (await getRayfinClient()).data.DisruptionScenario.delete({ id });
    },
  }), []);

  const actionApi = useMemo(() => ({
    list: async () => {
      const client = await getRayfinClient();
      return client.data.ActionItem.select([
        'id', 'title', 'scenarioName', 'priority', 'status', 'dueDate', 'createdAt', 'owner_id',
      ]).orderBy({ createdAt: 'desc' }).execute();
    },
    create: async (input: Omit<ActionItemRecord, 'id'>) =>
      (await getRayfinClient()).data.ActionItem.create(input),
    update: async (id: string, patch: Partial<Omit<ActionItemRecord, 'id'>>) =>
      (await getRayfinClient()).data.ActionItem.update({ id }, patch),
    remove: async (id: string) => {
      await (await getRayfinClient()).data.ActionItem.delete({ id });
    },
  }), []);

  const scenarios = useCrud<DisruptionScenarioRecord>(scenarioApi);
  const actions = useCrud<ActionItemRecord>(actionApi);

  const onRiskInteraction = (events: InteractionEvent[]) => {
    const selection = events.find((event) => event.action === 'select');
    const predicates = selection && 'selections' in selection ? selection.selections : [];
    const regionPredicate = predicates.flatMap((entry) => 'predicates' in entry ? entry.predicates : [])
      .find((predicate) => 'field' in predicate && predicate.field === 'region');
    if (regionPredicate && 'value' in regionPredicate && typeof regionPredicate.value === 'string') {
      setSelectedRegion(regionPredicate.value);
      setPage('regions');
    }
  };

  const currentLabel = navigation.find((item) => item.id === page)?.label ?? 'Overview';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`${mobileOpen ? 'flex' : 'hidden'} fixed inset-0 z-30 w-full flex-col border-r border-border bg-card p-500 md:static md:flex md:w-72`}>
          <div className="flex items-start justify-between gap-300">
            <button type="button" className="text-left" onClick={() => setPage('overview')}>
              <div className="mb-200 flex items-center gap-200 text-primary">
                <Activity className="icon-size-500" />
                <span className="text-200 font-bold uppercase tracking-widest">Federal demo</span>
              </div>
              <h1 className="font-heading text-500 font-bold leading-500">Fabric App Demo</h1>
            </button>
            <button type="button" className="rounded-lg p-200 hover:bg-accent md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="icon-size-300" /></button>
          </div>
          <div className="my-500 rounded-xl border border-primary/20 bg-primary/5 p-300">
            <p className="text-200 font-semibold text-primary">SYNTHETIC DEMO DATA</p>
            <p className="mt-100 text-200 leading-300 text-muted-foreground">Inspired by DOE and Commerce public sources. Not an official federal product.</p>
          </div>
          <nav className="space-y-100" aria-label="Primary navigation">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setPage(id); setMobileOpen(false); }}
                className={`flex w-full items-center gap-300 rounded-lg px-300 py-300 text-left text-300 font-medium transition ${page === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
              >
                <Icon className="icon-size-300" />{label}
              </button>
            ))}
          </nav>
          <div className="mt-auto border-t border-border pt-400 text-200 text-muted-foreground">
            <p>Release 1 · Medium complexity</p>
            <p className="mt-100">Protected by Fabric + Entra SSO</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-400 py-300 backdrop-blur md:px-700">
            <div className="flex items-center gap-300">
              <button type="button" className="rounded-lg p-200 hover:bg-accent md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="icon-size-300" /></button>
              <div>
                <p className="text-200 font-semibold uppercase tracking-widest text-primary">Command center</p>
                <h2 className="text-400 font-semibold">{currentLabel}</h2>
              </div>
            </div>
            <button type="button" className="rounded-lg border border-border bg-card p-200 hover:bg-accent" onClick={toggleTheme} aria-label={isDark ? 'Use light theme' : 'Use dark theme'}>
              {isDark ? <Sun className="icon-size-300" /> : <Moon className="icon-size-300" />}
            </button>
          </header>

          <div className="mx-auto max-w-7xl p-400 md:p-700">
            {page === 'overview' && <Overview visualTheme={visualTheme} onRiskInteraction={onRiskInteraction} scenarios={scenarios.items.length} actions={actions.items.filter((item) => item.status !== 'Complete').length} />}
            {page === 'regions' && <RegionalRisk selected={selectedRegion} onSelect={setSelectedRegion} />}
            {page === 'energy' && <EnergyConditions visualTheme={visualTheme} />}
            {page === 'trade' && <TradeDependencies />}
            {page === 'scenarios' && <ScenarioWorkspace scenarios={scenarios} actions={actions} />}
            {page === 'dictionary' && <DataDictionary />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Overview({ visualTheme, onRiskInteraction, scenarios, actions }: {
  visualTheme: ReturnType<typeof useCssTheme>;
  onRiskInteraction: (events: InteractionEvent[]) => void;
  scenarios: number;
  actions: number;
}) {
  const averageRisk = Math.round(rankedRegions.reduce((sum, item) => sum + item.riskScore, 0) / rankedRegions.length);
  const kpis = [
    { label: 'National resilience risk', value: averageRisk, detail: riskBand(averageRisk), icon: CircleGauge },
    { label: 'Regions elevated or higher', value: rankedRegions.filter((item) => item.riskScore >= 55).length, detail: `of ${rankedRegions.length} monitored`, icon: ShieldAlert },
    { label: 'High import dependencies', value: tradeDependencies.filter((item) => item.importShare >= 70).length, detail: 'critical categories', icon: Factory },
    { label: 'Open response work', value: scenarios + actions, detail: `${scenarios} cases · ${actions} actions`, icon: ClipboardCheck },
  ];
  return (
    <section>
      <PageHeading eyebrow="Unified operating picture" title="Where energy pressure meets trade dependency" description="Prioritize the regions, materials, and response actions most exposed to simultaneous grid and supply-chain disruption." />
      <div className="grid gap-300 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-border bg-card p-400 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground"><span className="text-200 font-semibold uppercase tracking-wide">{label}</span><Icon className="icon-size-300 text-primary" /></div>
            <p className="mt-300 font-numeric text-hero-800 font-bold">{value}</p>
            <p className="mt-100 text-200 text-muted-foreground">{detail}</p>
          </article>
        ))}
      </div>
      <div className="mt-500 grid gap-400 xl:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-400 shadow-sm xl:col-span-2">
          <CardHeading title="Regional resilience risk" detail="Select a bar to inspect its drivers." />
          <div className="h-96"><VegaVisual spec={riskSpec} data={riskTable} theme={visualTheme} onInteraction={onRiskInteraction} style={{ height: '100%' }} /></div>
        </article>
        <article className="rounded-2xl border border-border bg-card p-400 shadow-sm">
          <CardHeading title="Priority watchlist" detail="Highest composite exposure." />
          <div className="space-y-300">
            {rankedRegions.slice(0, 4).map((item, index) => (
              <div key={item.region} className="flex items-center gap-300 border-b border-border pb-300 last:border-0">
                <span className="font-numeric text-500 font-bold text-primary">0{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="font-semibold">{item.region}</p><p className="truncate text-200 text-muted-foreground">{item.topMaterial} · {item.port}</p></div>
                <RiskBadge score={item.riskScore} />
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function RegionalRisk({ selected, onSelect }: { selected: string; onSelect: (region: string) => void }) {
  const active = rankedRegions.find((item) => item.region === selected) ?? rankedRegions[0];
  const drivers = [
    ['Grid stress', active.gridStress], ['Price pressure', active.pricePressure],
    ['Import dependency', active.importDependency], ['Weather exposure', active.weatherExposure],
    ['Port congestion', active.portCongestion],
  ] as const;
  return (
    <section>
      <PageHeading eyebrow="Regional drill-down" title="Trace composite risk to its drivers" description="The score is transparent: 30% grid stress, 25% import dependency, and 15% each for price, weather, and ports." />
      <div className="grid gap-400 xl:grid-cols-3">
        <div className="space-y-200">
          {rankedRegions.map((item) => (
            <button key={item.region} type="button" onClick={() => onSelect(item.region)} className={`flex w-full items-center justify-between rounded-xl border p-300 text-left ${selected === item.region ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-accent'}`}>
              <div><p className="font-semibold">{item.region}</p><p className="text-200 text-muted-foreground">{item.states}</p></div><RiskBadge score={item.riskScore} />
            </button>
          ))}
        </div>
        <article className="rounded-2xl border border-border bg-card p-500 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-300"><div><p className="text-200 font-semibold uppercase tracking-widest text-primary">{active.code} operating region</p><h3 className="mt-100 text-600 font-bold">{active.region}</h3></div><RiskBadge score={active.riskScore} large /></div>
          <div className="mt-500 grid gap-300 sm:grid-cols-3">
            <Metric label="Peak demand" value={`${active.demandGw} GW`} />
            <Metric label="Renewable mix" value={`${active.renewablePct}%`} />
            <Metric label="Trade exposure" value={`$${active.importValueBn}B`} />
          </div>
          <div className="mt-500 space-y-300">
            {drivers.map(([label, value]) => <Progress key={label} label={label} value={value} />)}
          </div>
          <div className="mt-500 rounded-xl bg-muted p-400">
            <p className="text-200 font-semibold uppercase tracking-wide text-muted-foreground">Primary dependency</p>
            <p className="mt-100 font-semibold">{active.topMaterial} through {active.port}</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function EnergyConditions({ visualTheme }: { visualTheme: ReturnType<typeof useCssTheme> }) {
  return (
    <section>
      <PageHeading eyebrow="DOE-inspired indicators" title="Monitor demand, price, and generation flexibility" description="A synthetic 2025 time series illustrates how EIA electricity data can inform regional resilience decisions." />
      <div className="grid gap-400 xl:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-400 xl:col-span-2"><CardHeading title="National electricity demand" detail="Synthetic monthly average gigawatts." /><div className="h-96"><VegaVisual spec={energySpec} data={energyTable} theme={visualTheme} onInteraction={() => {}} style={{ height: '100%' }} /></div></article>
        <article className="rounded-2xl border border-border bg-card p-400">
          <CardHeading title="Generation mix" detail="Illustrative national share." />
          <div className="space-y-400">{generationMix.map((item) => <Progress key={item.source} label={item.source} value={item.share} suffix="%" />)}</div>
        </article>
      </div>
    </section>
  );
}

function TradeDependencies() {
  return (
    <section>
      <PageHeading eyebrow="Commerce-inspired indicators" title="Identify concentrated critical-material dependencies" description="Synthetic trade values demonstrate how Census international trade data can reveal energy-sector supply-chain exposure." />
      <div className="overflow-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-3xl text-left text-300">
          <thead className="bg-muted text-200 uppercase tracking-wide text-muted-foreground"><tr>{['Material', 'Import share', 'Annual value', 'Lead time', 'Dependent industry'].map((item) => <th key={item} className="px-400 py-300">{item}</th>)}</tr></thead>
          <tbody>{tradeDependencies.map((item) => <tr key={item.material} className="border-t border-border hover:bg-accent"><td className="px-400 py-400 font-semibold">{item.material}</td><td className="px-400 py-400"><span className="rounded-full bg-primary/10 px-200 py-100 font-numeric font-semibold text-primary">{item.importShare}%</span></td><td className="px-400 py-400 font-numeric">${item.annualValueBn}B</td><td className="px-400 py-400 font-numeric">{item.leadDays} days</td><td className="px-400 py-400 text-muted-foreground">{item.industry}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function ScenarioWorkspace({ scenarios, actions }: {
  scenarios: ReturnType<typeof useCrud<DisruptionScenarioRecord>>;
  actions: ReturnType<typeof useCrud<ActionItemRecord>>;
}) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState(rankedRegions[0].region);
  const [eventType, setEventType] = useState<EventType>('Grid constraint');
  const [severity, setSeverity] = useState(3);
  const [duration, setDuration] = useState(7);
  const [actionTitle, setActionTitle] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const baseline = rankedRegions.find((item) => item.region === region)?.riskScore ?? 50;
  const projected = projectScenarioRisk(baseline, severity, duration);

  const submitScenario = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const client = await getRayfinClient();
    await scenarios.create({
      name: name.trim(), region, eventType, severity, durationDays: duration,
      projectedRisk: projected, status: 'Draft', createdAt: new Date(), owner_id: getOwnerId(client),
    });
    setName('');
  };

  const submitAction = async (event: FormEvent) => {
    event.preventDefault();
    if (!actionTitle.trim()) return;
    const client = await getRayfinClient();
    await actions.create({
      title: actionTitle.trim(), scenarioName: scenarios.items[0]?.name ?? 'General resilience',
      priority: 'High', status: 'Open', createdAt: new Date(), owner_id: getOwnerId(client),
    });
    setActionTitle('');
  };

  return (
    <section>
      <PageHeading eyebrow="Operational workspace" title="Model a disruption and assign the response" description="Scenarios and action items are private to the signed-in user through Rayfin row-level authorization." />
      {(scenarios.error || actions.error) && <div role="alert" className="mb-400 rounded-xl border border-destructive/40 bg-destructive/5 p-300 text-300 text-destructive">{scenarios.error ?? actions.error}</div>}
      <div className="grid gap-400 xl:grid-cols-2">
        <form onSubmit={(event) => void submitScenario(event)} className="rounded-2xl border border-border bg-card p-500">
          <CardHeading title="New disruption case" detail="Compare a regional baseline with projected impact." />
          <div className="grid gap-300 sm:grid-cols-2">
            <Field label="Case name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required className="input" placeholder="Example: Coastal port outage" /></Field>
            <Field label="Region"><select value={region} onChange={(e) => setRegion(e.target.value)} className="input">{regions.map((item) => <option key={item.region}>{item.region}</option>)}</select></Field>
            <Field label="Event type"><select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)} className="input">{['Grid constraint', 'Port closure', 'Trade restriction', 'Severe weather'].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label={`Severity: ${severity} of 5`}><input type="range" min="1" max="5" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="w-full" /></Field>
            <Field label="Duration (days)"><input type="number" min="1" max="90" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input" /></Field>
            <div className="rounded-xl bg-muted p-300"><p className="text-200 text-muted-foreground">Projected risk</p><p className="font-numeric text-600 font-bold">{baseline} <ChevronRight className="inline icon-size-300" /> {projected}</p></div>
          </div>
          <button type="submit" disabled={scenarios.pending || !name.trim()} className="mt-400 flex items-center gap-200 rounded-lg bg-primary px-400 py-300 text-300 font-semibold text-primary-foreground disabled:opacity-50"><Plus className="icon-size-200" />Save case</button>
        </form>

        <div className="rounded-2xl border border-border bg-card p-500">
          <CardHeading title="Saved disruption cases" detail={scenarios.status === 'loading' ? 'Loading private cases…' : `${scenarios.items.length} saved cases`} />
          <div className="space-y-200">
            {scenarios.status === 'error' && <button type="button" className="text-300 font-semibold text-primary underline" onClick={() => void scenarios.refresh()}>Retry loading cases</button>}
            {scenarios.status === 'ready' && scenarios.items.length === 0 && <p className="rounded-xl border border-dashed border-border p-500 text-center text-300 text-muted-foreground">No cases yet. Create the first scenario.</p>}
            {scenarios.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-300">
                <div className="flex items-start justify-between gap-300"><div><p className="font-semibold">{item.name}</p><p className="text-200 text-muted-foreground">{item.region} · {item.eventType} · {item.durationDays} days</p></div><RiskBadge score={item.projectedRisk} /></div>
                {confirming === item.id ? <div className="mt-300 flex items-center justify-end gap-200 text-200"><span className="mr-auto text-destructive">Delete this case?</span><button type="button" onClick={() => setConfirming(null)}>Cancel</button><button type="button" className="rounded bg-destructive px-200 py-100 text-destructive-foreground" onClick={() => { void scenarios.remove(item.id); setConfirming(null); }}>Delete</button></div> : <button type="button" className="mt-200 flex items-center gap-100 text-200 text-muted-foreground hover:text-destructive" onClick={() => setConfirming(item.id)}><Trash2 className="icon-size-100" />Delete</button>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-400 rounded-2xl border border-border bg-card p-500">
        <CardHeading title="Mitigation actions" detail="Track the decision that follows the analysis." />
        <form onSubmit={(event) => void submitAction(event)} className="flex flex-col gap-200 sm:flex-row">
          <label htmlFor="action-title" className="sr-only">Action title</label>
          <input id="action-title" value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} maxLength={160} className="input flex-1" placeholder="Example: Pre-position replacement transformers" />
          <button type="submit" disabled={actions.pending || !actionTitle.trim()} className="rounded-lg bg-primary px-400 py-300 text-300 font-semibold text-primary-foreground disabled:opacity-50">Add action</button>
        </form>
        <div className="mt-400 grid gap-200 md:grid-cols-2">
          {actions.items.map((item) => <div key={item.id} className="flex items-center gap-300 rounded-xl border border-border p-300"><ClipboardCheck className="icon-size-400 text-primary" /><div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="text-200 text-muted-foreground">{item.scenarioName} · {item.priority}</p></div><button type="button" onClick={() => void actions.update(item.id, { status: item.status === 'Complete' ? 'Open' : 'Complete' })} className="rounded-lg border border-border px-200 py-100 text-200">{item.status}</button></div>)}
        </div>
      </div>
    </section>
  );
}

function DataDictionary() {
  const entities = [
    ['Regional energy indicators', 'Synthetic', 'Demand, price, renewable share, grid stress'],
    ['Trade dependencies', 'Synthetic', 'Import share, value, lead time, dependent industry'],
    ['DisruptionScenario', 'Rayfin SQL', 'Owner-scoped scenario assumptions and projected risk'],
    ['ActionItem', 'Rayfin SQL', 'Owner-scoped mitigation actions and status'],
  ];
  return (
    <section>
      <PageHeading eyebrow="Lineage and transparency" title="Know what is simulated, persisted, and replaceable" description="This release intentionally separates deterministic demo facts from operational records created by users." />
      <div className="grid gap-400 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-500"><CardHeading title="Data entities" detail="Release 1 logical model." /><div className="space-y-300">{entities.map(([name, store, fields]) => <div key={name} className="border-b border-border pb-300 last:border-0"><div className="flex items-center justify-between gap-300"><p className="font-semibold">{name}</p><span className="rounded-full bg-muted px-200 py-100 text-200">{store}</span></div><p className="mt-100 text-200 text-muted-foreground">{fields}</p></div>)}</div></article>
        <article className="rounded-2xl border border-border bg-card p-500"><CardHeading title="Public-source inspiration" detail="Optional future adapters; no live API is required." /><div className="space-y-300">{sourceNotes.map((source) => <a key={source.agency} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-border p-300 hover:border-primary"><p className="font-semibold">{source.agency}</p><p className="mt-100 text-200 text-muted-foreground">{source.inspiration}</p></a>)}</div></article>
      </div>
      <article className="mt-400 rounded-2xl border border-border bg-card p-500"><CardHeading title="Composite resilience formula" detail="Auditable by design." /><p className="font-monospace text-300 leading-500">Risk = 30% grid stress + 25% import dependency + 15% price pressure + 15% weather exposure + 15% port congestion</p></article>
    </section>
  );
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-600 max-w-4xl"><p className="text-200 font-bold uppercase tracking-widest text-primary">{eyebrow}</p><h2 className="mt-200 font-heading text-hero-800 font-bold leading-hero-800 md:text-hero-900 md:leading-hero-900">{title}</h2><p className="mt-300 text-400 leading-600 text-muted-foreground">{description}</p></div>;
}

function CardHeading({ title, detail }: { title: string; detail: string }) {
  return <div className="mb-400"><h3 className="text-400 font-semibold">{title}</h3><p className="mt-100 text-200 text-muted-foreground">{detail}</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border p-300"><p className="text-200 text-muted-foreground">{label}</p><p className="mt-100 font-numeric text-500 font-bold">{value}</p></div>;
}

function Progress({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return <div><div className="mb-100 flex justify-between text-200"><span>{label}</span><span className="font-numeric font-semibold">{value}{suffix}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(value, 100)}%` }} /></div></div>;
}

function RiskBadge({ score, large = false }: { score: number; large?: boolean }) {
  return <span className={`inline-flex items-center rounded-full border border-primary/20 bg-primary/10 font-numeric font-bold text-primary ${large ? 'px-300 py-200 text-500' : 'px-200 py-100 text-200'}`}>{score} · {riskBand(score)}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-100 text-200 font-semibold text-muted-foreground"><span>{label}</span>{children}</label>;
}

export default App;
