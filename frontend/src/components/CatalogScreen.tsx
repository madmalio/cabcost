import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import type { Assembly, Cabinet } from '../constants';
import { cabinetCategoryLabel } from '../constants';
import SkuModal from './SkuModal';
import CostDrawer from './CostDrawer';
import ConfirmDialog from './ConfirmDialog';
import Badge from './Badge';
import { iconButtonClass, primaryButtonClass } from './ui';

function sortByID(list: Assembly[]): Assembly[] {
  return [...list].sort((a, b) => a.id - b.id);
}

export default function CatalogScreen() {
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [boxes, setBoxes] = useState<Assembly[]>([]);
  const [doors, setDoors] = useState<Assembly[]>([]);
  const [fronts, setFronts] = useState<Assembly[]>([]);
  const [drawers, setDrawers] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Cabinet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cabinet | null>(null);
  const [confirm, setConfirm] = useState<Cabinet | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, b, d, f, dr] = await Promise.all([
        api.getCabinetCatalog(),
        api.getAssemblies('box'),
        api.getAssemblies('door'),
        api.getAssemblies('drawer_front'),
        api.getAssemblies('drawer_box'),
      ]);
      setCabinets(c);
      setBoxes(sortByID(b));
      setDoors(sortByID(d));
      setFronts(sortByID(f));
      setDrawers(sortByID(dr));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (c: Cabinet) => {
    setError('');
    try {
      await api.saveCabinet(c);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setError('');
    try {
      await api.deleteCabinet(confirm.id);
      setConfirm(null);
      await load();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex items-start justify-between border-b border-zinc-800 px-8 py-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Cabinet Catalog</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Standard cabinet SKUs. Click a card to preview its parametric cost.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => { setEditing(null); setModalOpen(true); }}
          >
            <Plus className="h-4 w-4" />
            Add SKU
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-8 mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading…</div>
        ) : cabinets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-500">No SKUs yet. Add your first cabinet to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cabinets.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-600"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-zinc-100">{c.sku}</span>
                      <Badge className="bg-zinc-500/15 text-zinc-300 border-zinc-500/30">
                        {cabinetCategoryLabel(c.category)}
                      </Badge>
                    </div>
                    <h3 className="mt-1 truncate text-sm text-zinc-400">{c.name}</h3>
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className={iconButtonClass}
                      title="Edit"
                      onClick={(e) => { e.stopPropagation(); setEditing(c); setModalOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={`${iconButtonClass} hover:bg-red-950/60 hover:text-red-300`}
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); setConfirm(c); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm tabular-nums text-zinc-300">
                  {c.width}" × {c.height}" × {c.depth}"
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.doors_count > 0 && (
                    <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-400">
                      {c.doors_count} door{c.doors_count > 1 ? 's' : ''}
                    </span>
                  )}
                  {c.drawers_count > 0 && (
                    <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-400">
                      {c.drawers_count} drawer{c.drawers_count > 1 ? 's' : ''}
                    </span>
                  )}
                  {c.shelves_count > 0 && (
                    <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-400">
                      {c.shelves_count} shelf{c.shelves_count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-zinc-500">{c.base_assembly_hours} base assembly hrs</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <SkuModal
          cabinet={editing}
          onClose={() => setModalOpen(false)}
          onSave={(c) => void handleSave(c)}
        />
      )}

      {selected && (
        <CostDrawer
          cabinet={selected}
          boxes={boxes}
          doors={doors}
          fronts={fronts}
          drawers={drawers}
          onClose={() => setSelected(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete SKU"
          message={`Are you sure you want to delete "${confirm.sku}"? This cannot be undone.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
