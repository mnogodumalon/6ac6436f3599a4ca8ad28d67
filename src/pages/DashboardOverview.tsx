import { useMemo, useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { IconPlus, IconSearch, IconUsers, IconCalendarPlus, IconAlertTriangle, IconMail } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClock, gruss, namen } from '@/lib/polish';
import { tx, appLabel, dateFnsLocale } from '@/i18n';

// Single flat entity, no status/date axis a widget could map → no widget fits;
// the primary surface is a searchable, newest-first registration list.
export default function DashboardOverview({ data }: { data: DashboardData }) {
  const crud = useEntityCrud(data);
  const clock = useClock();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'week' | 'unconfirmed'>('all');

  const all = crud.enriched.veranstaltungsanmeldung;

  const sorted = useMemo(
    () => [...all].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [all],
  );

  const weekStart = format(subDays(clock, 7), "yyyy-MM-dd'T'HH:mm");
  const isRecent = (r: (typeof all)[number]) => !!r.created_at && r.created_at.slice(0, 16) >= weekStart;
  const recent = sorted.filter(isRecent);
  const unconfirmed = sorted.filter(r => !r.fields.anmeldung_bestaetigung);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter(r => {
      if (filter === 'week' && !isRecent(r)) return false;
      if (filter === 'unconfirmed' && r.fields.anmeldung_bestaetigung) return false;
      if (!q) return true;
      return `${r.fields.vorname ?? ''} ${r.fields.nachname ?? ''} ${r.fields.email ?? ''}`.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, query, filter, weekStart]);

  const latestNames = namen(sorted.slice(0, 3).map(r => r.fields.vorname ?? ''));
  const context =
    sorted.length === 0
      ? tx('Noch hat sich niemand angemeldet — sobald die Anmeldeseite geteilt ist, erscheinen die Personen hier.')
      : recent.length > 0
        ? tx`Zuletzt angemeldet: ${latestNames} — ${recent.length} neue Anmeldungen in den letzten 7 Tagen.`
        : tx`Zuletzt angemeldet: ${latestNames}. In den letzten 7 Tagen ist niemand dazugekommen.`;

  const dateOf = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return format(parseISO(iso), 'dd.MM.yyyy HH:mm', { locale: dateFnsLocale() });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.veranstaltungsanmeldung.canWrite && (
          <Button onClick={() => crud.veranstaltungsanmeldung.openCreate({})}>
            <IconPlus size={16} className="shrink-0" />
            {tx('Anmeldung erfassen')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Anmeldungen')}
              value={sorted.length}
              icon={<IconUsers size={18} className="text-muted-foreground" />}
              onClick={() => setFilter('all')}
              active={filter === 'all'}
            />
            <StatStripItem
              title={tx('Neu (7 Tage)')}
              value={recent.length}
              icon={<IconCalendarPlus size={18} className="text-muted-foreground" />}
              tone={recent.length > 0 ? 'primary' : 'default'}
              onClick={() => setFilter(f => (f === 'week' ? 'all' : 'week'))}
              active={filter === 'week'}
            />
            <StatStripItem
              title={tx('Ohne Bestätigung')}
              value={unconfirmed.length}
              icon={<IconAlertTriangle size={18} className="text-muted-foreground" />}
              tone={unconfirmed.length > 0 ? 'warning' : 'default'}
              onClick={() => setFilter(f => (f === 'unconfirmed' ? 'all' : 'unconfirmed'))}
              active={filter === 'unconfirmed'}
            />
          </StatStrip>
        }
        primary={
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <h2 className="text-base font-semibold">{tx('Neueste Anmeldungen')}</h2>
              <div className="relative w-full sm:w-72">
                <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={tx('Name oder E-Mail suchen')}
                  className="pl-9"
                />
              </div>
            </div>
            {visible.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <IconUsers size={48} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {sorted.length === 0 ? tx('Noch keine Anmeldungen vorhanden.') : tx('Keine Anmeldung passt zu deiner Auswahl.')}
                </p>
                {sorted.length === 0 && crud.veranstaltungsanmeldung.canWrite && (
                  <Button onClick={() => crud.veranstaltungsanmeldung.openCreate({})}>
                    {tx('Erste Anmeldung erfassen')}
                  </Button>
                )}
              </div>
            ) : (
              <ul className="divide-y">
                {visible.map(r => (
                  <li key={r.record_id}>
                    <button
                      type="button"
                      onClick={() => crud.veranstaltungsanmeldung.openDetail(r)}
                      className="flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {(r.fields.vorname ?? '?').charAt(0).toUpperCase()}
                        {(r.fields.nachname ?? '').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {r.fields.vorname} {r.fields.nachname}
                        </div>
                        <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                          <IconMail size={14} className="shrink-0" />
                          <span className="truncate">{r.fields.email}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        <div className={r.fields.anmeldung_bestaetigung ? 'font-medium text-emerald-600' : 'font-medium text-amber-600'}>
                          {r.fields.anmeldung_bestaetigung ? tx('Bestätigt') : tx('Offen')}
                        </div>
                        <div className="text-muted-foreground">{dateOf(r.created_at)}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
      />
      {crud.surfaces}
    </div>
  );
}
