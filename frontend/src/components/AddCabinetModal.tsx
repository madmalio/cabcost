import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Modal from './Modal';
import { inputClass } from './ui';
import type { Cabinet } from '../constants';
import { cabinetCategoryLabel } from '../constants';

interface AddCabinetModalProps {
  catalog: Cabinet[];
  onClose: () => void;
  onAdd: (sku: string) => void;
}

export default function AddCabinetModal({ catalog, onClose, onAdd }: AddCabinetModalProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (c) => c.sku.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [query, catalog]);

  return (
    <Modal title="Add Cabinet" onClose={onClose}>
      <div className="mb-3 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          className={`${inputClass} pl-9`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search SKU or name…"
          autoFocus
        />
      </div>

      <div className="max-h-72 space-y-1 overflow-y-auto">
        {results.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">No matching cabinets.</p>
        ) : (
          results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onAdd(c.sku)}
              className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800"
            >
              <span className="font-mono text-sm font-semibold text-zinc-100">{c.sku}</span>
              <span className="flex-1 truncate text-sm text-zinc-400">{c.name}</span>
              <span className="shrink-0 text-xs text-zinc-500">{cabinetCategoryLabel(c.category)}</span>
              <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                {c.width}" × {c.height}" × {c.depth}"
              </span>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
