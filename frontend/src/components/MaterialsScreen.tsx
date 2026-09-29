import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import {
  FILTERS,
  categoryBadge,
  categoryLabel,
  roleBadge,
  roleLabel,
  unitLabel,
} from '../constants';
import type { Hardware, Material } from '../constants';
import Badge from './Badge';
import MaterialModal from './MaterialModal';
import HardwareModal from './HardwareModal';
import ConfirmDialog from './ConfirmDialog';
import { iconButtonClass, primaryButtonClass, secondaryButtonClass } from './ui';

interface TableRow {
  kind: 'material' | 'hardware';
  id: number;
  name: string;
  badgeClass: string;
  badgeLabel: string;
  unit: string;
  unitCost: number;
  waste: number | null;
}

type ModalState =
  | { kind: 'material'; editing: Material | null }
  | { kind: 'hardware'; editing: Hardware | null }
  | null;

type ConfirmState =
  | { kind: 'material'; item: Material }
  | { kind: 'hardware'; item: Hardware }
  | null;

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function MaterialsScreen() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [m, h] = await Promise.all([api.getMaterials(), api.getHardware()]);
      setMaterials(m);
      setHardware(h);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows: TableRow[] = useMemo(() => {
    const materialRows: TableRow[] = materials
      .filter((m) => filter === 'all' || m.role === filter)
      .map((m) => ({
        kind: 'material' as const,
        id: m.id,
        name: m.name,
        badgeClass: roleBadge(m.role),
        badgeLabel: roleLabel(m.role),
        unit: unitLabel(m.unit),
        unitCost: m.unit_cost,
        waste: m.waste_percent,
      }));
    const hardwareRows: TableRow[] =
      filter === 'all' || filter === 'hardware'
        ? hardware.map((h) => ({
            kind: 'hardware' as const,
            id: h.id,
            name: h.name,
            badgeClass: categoryBadge(h.category),
            badgeLabel: categoryLabel(h.category),
            unit: unitLabel(h.unit),
            unitCost: h.unit_cost,
            waste: null,
          }))
        : [];
    return [...materialRows, ...hardwareRows].sort((a, b) => a.name.localeCompare(b.name));
  }, [materials, hardware, filter]);

  const handleSaveMaterial = async (m: Material) => {
    setBusy(true);
    setError('');
    try {
      await api.saveMaterial(m);
      setModal(null);
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveHardware = async (h: Hardware) => {
    setBusy(true);
    setError('');
    try {
      await api.saveHardware(h);
      setModal(null);
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    setError('');
    try {
      if (confirm.kind === 'material') {
        await api.deleteMaterial(confirm.item.id);
      } else {
        await api.deleteHardware(confirm.item.id);
      }
      setConfirm(null);
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex items-start justify-between border-b border-zinc-800 px-8 py-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Materials & Hardware</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the sheet goods, lumber, edgeband, and hardware used in your builds.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button type="button" className={secondaryButtonClass} onClick={() => setModal({ kind: 'hardware', editing: null })}>
            <Plus className="h-4 w-4" />
            Add Hardware
          </button>
          <button type="button" className={primaryButtonClass} onClick={() => setModal({ kind: 'material', editing: null })}>
            <Plus className="h-4 w-4" />
            Add Material
          </button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 px-8 py-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-8 mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-8 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-500">No items match this filter.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-3 pr-4 font-medium">Name</th>
                <th className="py-3 pr-4 font-medium">Role / Category</th>
                <th className="py-3 pr-4 font-medium">Unit</th>
                <th className="py-3 pr-4 text-right font-medium">Unit Cost</th>
                <th className="py-3 pr-4 text-right font-medium">Waste</th>
                <th className="py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-b border-zinc-800/60 hover:bg-zinc-900/50">
                  <td className="py-3 pr-4 text-zinc-200">{row.name}</td>
                  <td className="py-3 pr-4">
                    <Badge className={row.badgeClass}>{row.badgeLabel}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">{row.unit}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-zinc-200">{currency.format(row.unitCost)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-zinc-400">
                    {row.waste === null ? '—' : `${row.waste}%`}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className={iconButtonClass}
                        title="Edit"
                        onClick={() =>
                          row.kind === 'material'
                            ? setModal({
                                kind: 'material',
                                editing: materials.find((m) => m.id === row.id) ?? null,
                              })
                            : setModal({
                                kind: 'hardware',
                                editing: hardware.find((h) => h.id === row.id) ?? null,
                              })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={`${iconButtonClass} hover:bg-red-950/60 hover:text-red-300`}
                        title="Delete"
                        onClick={() =>
                          row.kind === 'material'
                            ? setConfirm({
                                kind: 'material',
                                item: materials.find((m) => m.id === row.id)!,
                              })
                            : setConfirm({
                                kind: 'hardware',
                                item: hardware.find((h) => h.id === row.id)!,
                              })
                        }
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

      {modal?.kind === 'material' && (
        <MaterialModal
          material={modal.editing}
          onClose={() => setModal(null)}
          onSave={(m) => void handleSaveMaterial(m)}
        />
      )}
      {modal?.kind === 'hardware' && (
        <HardwareModal
          hardware={modal.editing}
          onClose={() => setModal(null)}
          onSave={(h) => void handleSaveHardware(h)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.kind === 'material' ? 'Delete Material' : 'Delete Hardware'}
          message={`Are you sure you want to delete "${confirm.item.name}"? This cannot be undone.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirm(null)}
        />
      )}
      {busy && <span className="sr-only">Working…</span>}
    </div>
  );
}
