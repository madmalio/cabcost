import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import type { Assembly, Hardware, Material } from '../constants';
import {
  assemblyTypeLabel,
  constructionStyleLabel,
  roleBadge,
  roleLabel,
  unitLabel,
} from '../constants';
import Badge from './Badge';
import AssemblyModal from './AssemblyModal';
import ConfirmDialog from './ConfirmDialog';
import { iconButtonClass, primaryButtonClass, secondaryButtonClass } from './ui';

const SUB_TABS = [
  { key: 'box', label: 'Box Assemblies' },
  { key: 'door', label: 'Door Styles' },
  { key: 'drawer_front', label: 'Drawer Front Styles' },
  { key: 'drawer_box', label: 'Drawer Boxes' },
] as const;

function materialById(all: Material[], id: number | undefined): Material | undefined {
  if (id === undefined || id === null) return undefined;
  return all.find((m) => m.id === id);
}

function hardwareById(all: Hardware[], id: number | undefined): Hardware | undefined {
  if (id === undefined || id === null) return undefined;
  return all.find((h) => h.id === id);
}

function fkBadge(mat: Material | undefined) {
  if (!mat) return null;
  return (
    <Badge key={mat.id} className={roleBadge(mat.role)}>
      {mat.name}
    </Badge>
  );
}

export default function ProfilesScreen() {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [subTab, setSubTab] = useState('box');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Assembly | null>(null);
  const [confirm, setConfirm] = useState<Assembly | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [a, m, h] = await Promise.all([
        api.getAssemblies(subTab),
        api.getMaterials(),
        api.getHardware(),
      ]);
      setAssemblies(a);
      setMaterials(m);
      setHardware(h);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (a: Assembly) => {
    setBusy(true);
    setError('');
    try {
      await api.saveAssembly(a);
      setModalOpen(false);
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
      await api.deleteAssembly(confirm.id);
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
          <h1 className="text-xl font-semibold text-zinc-100">Construction Profiles</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Define your shop's reusable build packages — boxes, doors, and drawer types.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button type="button" className={primaryButtonClass} onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add Assembly
          </button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 px-8 py-3">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSubTab(t.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              subTab === t.key
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-8 mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading…</div>
        ) : assemblies.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-500">
              {subTab
                ? `No ${SUB_TABS.find((t) => t.key === subTab)?.label} yet. Add your first assembly to get started.`
                : 'No assemblies yet. Add your first assembly to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assemblies.map((a) => {
              const core = materialById(materials, a.core_material_id);
              const back = materialById(materials, a.back_material_id);
              const panel = materialById(materials, a.panel_material_id);
              const faceLumber = materialById(materials, a.face_lumber_id);
              const edgeband = materialById(materials, a.edgeband_id);
              const hw = hardwareById(hardware, a.hardware_id);
              const laborUnit = a.type === 'door' ? 'door' : a.type === 'drawer_front' ? 'front' : 'box';

              return (
                <div
                  key={a.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-zinc-100">{a.name}</h3>
                        {a.is_default && (
                          <span className="shrink-0 rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                        <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 uppercase tracking-wide text-zinc-300">
                          {assemblyTypeLabel(a.type)}
                        </span>
                        {a.type === 'box' && (
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 uppercase tracking-wide text-zinc-500">
                            {constructionStyleLabel(a.construction_style)}
                          </span>
                        )}
                        {a.is_outsourced && (
                          <span className="rounded bg-amber-950/50 px-1.5 py-0.5 uppercase tracking-wide text-amber-400">
                            Outsourced
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        type="button"
                        className={iconButtonClass}
                        title="Edit"
                        onClick={() => { setEditing(a); setModalOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={`${iconButtonClass} hover:bg-red-950/60 hover:text-red-300`}
                        title="Delete"
                        onClick={() => setConfirm(a)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(core || back || panel || faceLumber || edgeband || hw) && (
                      <div className="flex flex-wrap gap-1.5">
                        {fkBadge(core)}
                        {fkBadge(back)}
                        {fkBadge(panel)}
                        {fkBadge(faceLumber)}
                        {fkBadge(edgeband)}
                        {hw && (
                          <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30">
                            {hw.name}
                          </Badge>
                        )}
                      </div>
                    )}

                    {(a.requires_finish || a.requires_edgeband) && (
                      <div className="flex flex-wrap gap-1.5">
                        {a.requires_finish && (
                          <span className="rounded bg-fuchsia-950/50 px-1.5 py-0.5 text-xs text-fuchsia-300">Finish</span>
                        )}
                        {a.requires_edgeband && (
                          <span className="rounded bg-violet-950/50 px-1.5 py-0.5 text-xs text-violet-300">Edgeband</span>
                        )}
                      </div>
                    )}

                    {a.is_outsourced && a.type !== 'box' && a.prep_labor_hours > 0 && (
                      <p className="text-xs text-zinc-400">
                        Prep & Bore: {a.prep_labor_hours} hrs/{laborUnit}
                      </p>
                    )}
                    {!a.is_outsourced && a.build_labor_hours > 0 && (
                      <p className="text-xs text-zinc-400">
                        Build Labor: {a.build_labor_hours} hrs/{laborUnit}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <AssemblyModal
          assembly={editing}
          materials={materials}
          hardware={hardware}
          onClose={() => setModalOpen(false)}
          onSave={(a) => void handleSave(a)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete Assembly"
          message={`Are you sure you want to delete "${confirm.name}"? This cannot be undone.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirm(null)}
        />
      )}
      {busy && <span className="sr-only">Working…</span>}
    </div>
  );
}
