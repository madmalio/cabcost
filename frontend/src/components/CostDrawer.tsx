import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';
import type { Assembly, Cabinet, CabinetCostBreakdown, CostLine } from '../constants';
import { inputClass, labelClass } from './ui';

interface CostDrawerProps {
  cabinet: Cabinet;
  boxes: Assembly[];
  doors: Assembly[];
  fronts: Assembly[];
  drawers: Assembly[];
  onClose: () => void;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function defaultID(list: Assembly[]): number {
  return list.find((a) => a.is_default)?.id ?? list[0]?.id ?? 0;
}

function LineList({ lines, totalLabel }: { lines: CostLine[]; totalLabel: string }) {
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">{l.label}</span>
          <span className="tabular-nums text-zinc-200">{currency.format(l.amount)}</span>
        </div>
      ))}
    </div>
  );
}

export default function CostDrawer({ cabinet, boxes, doors, fronts, drawers, onClose }: CostDrawerProps) {
  const [boxId, setBoxId] = useState(defaultID(boxes));
  const [doorId, setDoorId] = useState(defaultID(doors));
  const [frontId, setFrontId] = useState(defaultID(fronts));
  const [drawerId, setDrawerId] = useState(defaultID(drawers));
  const [isFinished, setIsFinished] = useState(false);
  const [breakdown, setBreakdown] = useState<CabinetCostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const calc = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const b = await api.calculateCabinetCost(cabinet.sku, boxId, doorId, frontId, drawerId, isFinished);
      setBreakdown(b);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [cabinet.sku, boxId, doorId, frontId, drawerId, isFinished]);

  useEffect(() => {
    void calc();
  }, [calc]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-[420px] max-w-full flex-col border-l border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">{cabinet.name}</h3>
            <p className="text-xs text-zinc-500">
              {cabinet.sku} · {cabinet.width}" W × {cabinet.height}" H × {cabinet.depth}" D
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label className={labelClass}>Box Profile</label>
            <select className={inputClass} value={boxId} onChange={(e) => setBoxId(Number(e.target.value))}>
              {boxes.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Door Style</label>
            <select className={inputClass} value={doorId} onChange={(e) => setDoorId(Number(e.target.value))}>
              {doors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Drawer Front Style</label>
            <select className={inputClass} value={frontId} onChange={(e) => setFrontId(Number(e.target.value))}>
              {fronts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Drawer Box Type</label>
            <select className={inputClass} value={drawerId} onChange={(e) => setDrawerId(Number(e.target.value))}>
              {drawers.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Finish</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsFinished(false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  !isFinished
                    ? 'border-zinc-500 bg-zinc-700 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                Unfinished
              </button>
              <button
                type="button"
                onClick={() => setIsFinished(true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isFinished
                    ? 'border-zinc-500 bg-zinc-700 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                Finished
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500">Calculating…</div>
          ) : breakdown ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Direct Materials</h4>
                  <span className="text-sm font-semibold tabular-nums text-zinc-100">
                    {currency.format(breakdown.materials_total)}
                  </span>
                </div>
                <LineList lines={breakdown.materials} totalLabel="Materials" />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Direct Labor</h4>
                  <span className="text-sm font-semibold tabular-nums text-zinc-100">
                    {currency.format(breakdown.labor_total)}
                  </span>
                </div>
                <LineList lines={breakdown.labor} totalLabel="Labor" />
                {breakdown.labor_hours > 0 && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {breakdown.labor_hours} bench hours
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-xl border border-zinc-700 bg-zinc-800/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Total Shop Cost</span>
                  <span className="font-semibold tabular-nums text-zinc-100">
                    {currency.format(breakdown.total_shop_cost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Suggested Retail</span>
                  <span className="font-semibold tabular-nums text-emerald-400">
                    {currency.format(breakdown.suggested_retail)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Margin</span>
                  <span className="tabular-nums text-zinc-200">{breakdown.margin_percent}%</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
