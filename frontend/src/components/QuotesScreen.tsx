import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Copy, Trash2 } from 'lucide-react';
import { api } from '../api';
import type { QuoteListItem } from '../constants';
import { QUOTE_STATUSES, quoteStatusBadge } from '../constants';
import ConfirmDialog from './ConfirmDialog';
import QuoteWorkbench from './QuoteWorkbench';
import { iconButtonClass, primaryButtonClass } from './ui';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function defaultAssemblyID(list: { id: number; is_default: boolean }[]): number {
  return list.find((a) => a.is_default)?.id ?? list[0]?.id ?? 0;
}

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workbenchId, setWorkbenchId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<QuoteListItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQuotes(await api.getQuotes());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (it) =>
        it.job_name.toLowerCase().includes(q) ||
        (it.client_name ?? '').toLowerCase().includes(q),
    );
  }, [quotes, search]);

  const handleNew = async () => {
    setCreating(true);
    setError('');
    try {
      const [boxes, doors, fronts, drawers] = await Promise.all([
        api.getAssemblies('box'),
        api.getAssemblies('door'),
        api.getAssemblies('drawer_front'),
        api.getAssemblies('drawer_box'),
      ]);
      const id = await api.saveQuote({
        id: 0,
        job_name: 'Untitled Quote',
        client_name: '',
        client_phone: '',
        status: 'draft',
        box_assembly_id: defaultAssemblyID(boxes),
        door_assembly_id: defaultAssemblyID(doors),
        drawer_front_assembly_id: defaultAssemblyID(fronts),
        drawer_assembly_id: defaultAssemblyID(drawers),
        is_finished: true,
        has_edge_detail: false,
        target_margin_percent: 30,
        prefab_margin_percent: 35,
        notes: '',
        created_at: '',
        updated_at: '',
      });
      setWorkbenchId(id);
    } catch (err) {
      setError(String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (q: QuoteListItem) => {
    setError('');
    try {
      await api.duplicateQuote(q.id);
      await load();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setError('');
    try {
      await api.deleteQuote(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleStatusChange = async (q: QuoteListItem, status: string) => {
    if (status === q.status) return;
    setError('');
    try {
      await api.updateQuoteStatus(q.id, status);
      await load();
    } catch (err) {
      setError(String(err));
    }
  };

  if (workbenchId !== null) {
    return (
      <QuoteWorkbench
        key={workbenchId}
        quoteId={workbenchId}
        onBack={() => {
          setWorkbenchId(null);
          void load();
        }}
        onDuplicate={(newId) => setWorkbenchId(newId)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex items-start justify-between border-b border-zinc-800 px-8 py-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Job Quotes</h1>
          <p className="mt-1 text-sm text-zinc-500">Create and manage project proposals and estimates.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="w-64 rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs or clients…"
            />
          </div>
          <button type="button" className={primaryButtonClass} onClick={handleNew} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? 'Creating…' : 'New Quote'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-8 mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-8 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-500">No quotes yet. Create your first quote to get started.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-3 pr-4 font-medium">Job Name</th>
                <th className="py-3 pr-4 font-medium">Client</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 text-right font-medium">Cabinets</th>
                <th className="py-3 pr-4 text-right font-medium">Final Bid</th>
                <th className="py-3 pr-4 font-medium">Last Updated</th>
                <th className="py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => setWorkbenchId(q.id)}
                  className="cursor-pointer border-b border-zinc-800/60 hover:bg-zinc-900/50"
                >
                  <td className="py-3 pr-4 font-medium text-zinc-100">{q.job_name}</td>
                  <td className="py-3 pr-4 text-zinc-400">{q.client_name || '—'}</td>
                  <td className="py-3 pr-4">
                    <select
                      className={`cursor-pointer rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors focus:ring-1 focus:ring-zinc-600 ${quoteStatusBadge(q.status)}`}
                      value={q.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => void handleStatusChange(q, e.target.value)}
                    >
                      {QUOTE_STATUSES.map((s) => (
                        <option key={s.value} value={s.value} className="bg-zinc-900 text-zinc-100">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-zinc-300">{q.total_cabinets}</td>
                  <td className="py-3 pr-4 text-right tabular-nums font-medium text-zinc-100">
                    {currency.format(q.total_retail_price)}
                  </td>
                  <td className="py-3 pr-4 text-zinc-500">
                    {q.updated_at ? new Date(q.updated_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className={iconButtonClass}
                        title="Duplicate"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDuplicate(q);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={`${iconButtonClass} hover:bg-red-950/60 hover:text-red-300`}
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(q);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Quote"
          message={`Are you sure you want to delete "${confirmDelete.job_name}"? This cannot be undone.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
