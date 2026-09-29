import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Minus,
  Save,
  Copy,
  Printer,
  Pencil,
} from 'lucide-react';
import { api } from '../api';
import type {
  Assembly,
  Cabinet,
  CabinetCostBreakdown,
  FinancialSummary,
  Quote,
  QuoteBuyout,
  QuoteBuyoutLine,
  QuoteCabinet,
  QuoteCabinetLine,
  QuoteDetailResponse,
} from '../constants';
import {
  buyoutCategoryBadge,
  buyoutCategoryLabel,
  quoteStatusBadge,
  quoteStatusLabel,
  QUOTE_STATUSES,
  retailFromCost,
} from '../constants';
import Badge from './Badge';
import ConfirmDialog from './ConfirmDialog';
import AddCabinetModal from './AddCabinetModal';
import BuyoutModal from './BuyoutModal';
import { iconButtonClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './ui';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const r2 = (n: number) => Math.round(n * 100) / 100;

interface QuoteWorkbenchProps {
  quoteId: number;
  onBack: () => void;
  onDuplicate: (newId: number) => void;
}

export default function QuoteWorkbench({ quoteId, onBack, onDuplicate }: QuoteWorkbenchProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [cabinets, setCabinets] = useState<QuoteCabinetLine[]>([]);
  const [buyouts, setBuyouts] = useState<QuoteBuyoutLine[]>([]);
  const [boxes, setBoxes] = useState<Assembly[]>([]);
  const [doors, setDoors] = useState<Assembly[]>([]);
  const [fronts, setFronts] = useState<Assembly[]>([]);
  const [drawers, setDrawers] = useState<Assembly[]>([]);
  const [catalog, setCatalog] = useState<Cabinet[]>([]);
  const [costs, setCosts] = useState<Record<number, CabinetCostBreakdown>>({});
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [addCabinetOpen, setAddCabinetOpen] = useState(false);
  const [buyoutModal, setBuyoutModal] = useState<QuoteBuyoutLine | null>(null);
  const [buyoutOpen, setBuyoutOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const catalogBySku = useMemo(() => {
    const m: Record<string, Cabinet> = {};
    for (const c of catalog) m[c.sku] = c;
    return m;
  }, [catalog]);

  const refreshLines = useCallback(async () => {
    const d: QuoteDetailResponse = await api.getQuoteDetail(quoteId);
    setCabinets(d.cabinets);
    setBuyouts(d.buyouts);
  }, [quoteId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [detail, b, d, f, dw, cat] = await Promise.all([
        api.getQuoteDetail(quoteId),
        api.getAssemblies('box'),
        api.getAssemblies('door'),
        api.getAssemblies('drawer_front'),
        api.getAssemblies('drawer_box'),
        api.getCabinetCatalog(),
      ]);
      setQuote(detail.quote);
      setCabinets(detail.cabinets);
      setBuyouts(detail.buyouts);
      setSummary(detail.summary);
      setBoxes(b);
      setDoors(d);
      setFronts(f);
      setDrawers(dw);
      setCatalog(cat);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live client-side re-evaluation whenever specs or lines change.
  useEffect(() => {
    if (!quote) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        cabinets.map((c) =>
          api.calculateCabinetCostOverride(
            c.cabinet_sku,
            c.custom_width ?? 0,
            c.custom_height ?? 0,
            c.custom_depth ?? 0,
            quote.box_assembly_id,
            quote.door_assembly_id,
            quote.drawer_front_assembly_id,
            quote.drawer_assembly_id,
            quote.is_finished,
          ),
        ),
      );
      if (cancelled) return;

      const newCosts: Record<number, CabinetCostBreakdown> = {};
      let materials = 0;
      let laborHours = 0;
      let labor = 0;
      let shopCost = 0;
      cabinets.forEach((c, i) => {
        const b = results[i];
        newCosts[c.id] = b;
        const q = c.quantity;
        materials += b.materials_total * q;
        laborHours += b.labor_hours * q;
        labor += b.labor_total * q;
        shopCost += b.total_shop_cost * q;
      });
      const customRetail = retailFromCost(shopCost, quote.target_margin_percent);
      let buyoutCost = 0;
      let buyoutRetail = 0;
      buyouts.forEach((b) => {
        buyoutCost += b.vendor_invoice_cost;
        buyoutRetail += retailFromCost(b.vendor_invoice_cost, b.margin_percent);
      });
      const totalJobCost = shopCost + buyoutCost;
      const totalRetail = customRetail + buyoutRetail;
      const profit = totalRetail - totalJobCost;
      const blended = totalRetail ? (profit / totalRetail) * 100 : 0;

      setCosts(newCosts);
      setSummary({
        shop_materials_total: materials,
        shop_labor_hours: laborHours,
        shop_labor_total: labor,
        custom_cabinets_shop_cost: shopCost,
        custom_cabinets_retail: customRetail,
        buyout_cost_total: buyoutCost,
        buyout_retail_total: buyoutRetail,
        total_job_cost: totalJobCost,
        total_proposal_retail: totalRetail,
        total_profit: profit,
        blended_margin_percent: blended,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [quote?.box_assembly_id, quote?.door_assembly_id, quote?.drawer_front_assembly_id, quote?.drawer_assembly_id, quote?.is_finished, quote?.target_margin_percent, cabinets, buyouts]);

  const patchQuote = (patch: Partial<Quote>) => {
    setQuote((q) => (q ? { ...q, ...patch } : q));
  };

  const handleSave = async () => {
    if (!quote) return;
    setError('');
    try {
      await api.saveQuote(quote);
      setToast('Saved');
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDuplicate = async () => {
    setError('');
    try {
      const newId = await api.duplicateQuote(quoteId);
      onDuplicate(newId);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await api.deleteQuote(quoteId);
      onBack();
    } catch (err) {
      setError(String(err));
    }
  };

  const handlePrint = () => {
    void api.printQuote();
  };

  const handleAddCabinet = async (sku: string) => {
    setError('');
    try {
      await api.addQuoteCabinet({ id: 0, quote_id: quoteId, cabinet_sku: sku, quantity: 1, notes: '' });
      setAddCabinetOpen(false);
      await refreshLines();
    } catch (err) {
      setError(String(err));
    }
  };

  const persistCabinet = async (item: QuoteCabinet) => {
    setError('');
    try {
      await api.updateQuoteCabinet(item);
    } catch (err) {
      setError(String(err));
    }
  };

  const setQuantity = (id: number, qty: number) => {
    if (qty < 1) return;
    const next = cabinets.map((c) => (c.id === id ? { ...c, quantity: qty } : c));
    setCabinets(next);
    const target = next.find((c) => c.id === id);
    if (target) void persistCabinet(toQuoteCabinet(target));
  };

  const setDim = (id: number, key: 'custom_width' | 'custom_height' | 'custom_depth', value: string) => {
    const parsed = value.trim() === '' ? undefined : Number(value);
    const next = cabinets.map((c) => (c.id === id ? { ...c, [key]: parsed } : c));
    setCabinets(next);
  };

  const persistDim = (id: number) => {
    const target = cabinets.find((c) => c.id === id);
    if (target) void persistCabinet(toQuoteCabinet(target));
  };

  const handleDeleteCabinet = async (id: number) => {
    setError('');
    try {
      await api.deleteQuoteCabinet(id);
      await refreshLines();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSaveBuyout = async (b: QuoteBuyout) => {
    setError('');
    try {
      const payload = { ...b, quote_id: quoteId };
      if (b.id === 0) {
        await api.addQuoteBuyout(payload);
      } else {
        await api.updateQuoteBuyout(payload);
      }
      setBuyoutOpen(false);
      await refreshLines();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDeleteBuyout = async (id: number) => {
    setError('');
    try {
      await api.deleteQuoteBuyout(id);
      await refreshLines();
    } catch (err) {
      setError(String(err));
    }
  };

  if (loading || !quote) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading…</div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 print:hidden">
        <div className="flex items-center gap-3">
          <button type="button" className={iconButtonClass} onClick={onBack} title="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-zinc-100">{quote.job_name || 'Untitled Quote'}</h1>
            <p className="text-xs text-zinc-500">Quote #{quote.id}</p>
          </div>
        </div>
        {toast && <span className="text-sm text-emerald-400">{toast}</span>}
        <div className="flex items-center gap-2">
          <button type="button" className={secondaryButtonClass} onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button type="button" className={secondaryButtonClass} onClick={handleDuplicate}>
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          <button type="button" className={secondaryButtonClass} onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2.5 text-sm text-red-300 print:hidden">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* 1. Project specifications */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Project Specifications</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Job Name</label>
                  <input className={inputClass} value={quote.job_name} onChange={(e) => patchQuote({ job_name: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Client Name</label>
                  <input className={inputClass} value={quote.client_name} onChange={(e) => patchQuote({ client_name: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Client Phone</label>
                  <input className={inputClass} value={quote.client_phone} onChange={(e) => patchQuote({ client_phone: e.target.value })} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={inputClass} value={quote.status} onChange={(e) => patchQuote({ status: e.target.value })}>
                    {QUOTE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Box Assembly</label>
                  <select className={inputClass} value={quote.box_assembly_id} onChange={(e) => patchQuote({ box_assembly_id: Number(e.target.value) })}>
                    {boxes.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Door Style</label>
                  <select className={inputClass} value={quote.door_assembly_id} onChange={(e) => patchQuote({ door_assembly_id: Number(e.target.value) })}>
                    {doors.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Drawer Front Style</label>
                  <select className={inputClass} value={quote.drawer_front_assembly_id} onChange={(e) => patchQuote({ drawer_front_assembly_id: Number(e.target.value) })}>
                    {fronts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Drawer Box Type</label>
                  <select className={inputClass} value={quote.drawer_assembly_id} onChange={(e) => patchQuote({ drawer_assembly_id: Number(e.target.value) })}>
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
                      onClick={() => patchQuote({ is_finished: false })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        !quote.is_finished ? 'border-zinc-500 bg-zinc-700 text-zinc-100' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                      }`}
                    >
                      Unfinished
                    </button>
                    <button
                      type="button"
                      onClick={() => patchQuote({ is_finished: true })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        quote.is_finished ? 'border-zinc-500 bg-zinc-700 text-zinc-100' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                      }`}
                    >
                      Finished
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Target Margin %</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={inputClass}
                    value={quote.target_margin_percent}
                    onChange={(e) => patchQuote({ target_margin_percent: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* 2. Cabinet schedule */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Custom Cabinet Schedule</h2>
                <button type="button" className={secondaryButtonClass} onClick={() => setAddCabinetOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Cabinet
                </button>
              </div>

              {cabinets.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">No cabinets yet. Add a cabinet from the catalog.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
                        <th className="py-2 pr-3 font-medium">Qty</th>
                        <th className="py-2 pr-3 font-medium">SKU</th>
                        <th className="py-2 pr-3 font-medium">Description</th>
                        <th className="py-2 pr-3 font-medium">W / H / D</th>
                        <th className="py-2 pr-3 text-right font-medium">Unit Shop</th>
                        <th className="py-2 pr-3 text-right font-medium">Ext. Shop</th>
                        <th className="py-2 text-right font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cabinets.map((c) => {
                        const base = catalogBySku[c.cabinet_sku];
                        const cost = costs[c.id];
                        const unit = cost ? cost.total_shop_cost : 0;
                        return (
                          <tr key={c.id} className="border-b border-zinc-800/60">
                            <td className="py-2 pr-3">
                              <div className="flex items-center gap-1">
                                <button type="button" className={iconButtonClass} onClick={() => setQuantity(c.id, c.quantity - 1)}>
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-6 text-center tabular-nums text-zinc-100">{c.quantity}</span>
                                <button type="button" className={iconButtonClass} onClick={() => setQuantity(c.id, c.quantity + 1)}>
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-2 pr-3 font-mono text-zinc-100">{c.cabinet_sku}</td>
                            <td className="py-2 pr-3 text-zinc-400">{c.catalog_name}</td>
                            <td className="py-2 pr-3">
                              <div className="flex items-center gap-1">
                                <input
                                  className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs tabular-nums text-zinc-100 outline-none focus:border-zinc-500"
                                  placeholder={base ? String(base.width) : 'W'}
                                  value={c.custom_width ?? ''}
                                  onChange={(e) => setDim(c.id, 'custom_width', e.target.value)}
                                  onBlur={() => persistDim(c.id)}
                                />
                                <input
                                  className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs tabular-nums text-zinc-100 outline-none focus:border-zinc-500"
                                  placeholder={base ? String(base.height) : 'H'}
                                  value={c.custom_height ?? ''}
                                  onChange={(e) => setDim(c.id, 'custom_height', e.target.value)}
                                  onBlur={() => persistDim(c.id)}
                                />
                                <input
                                  className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs tabular-nums text-zinc-100 outline-none focus:border-zinc-500"
                                  placeholder={base ? String(base.depth) : 'D'}
                                  value={c.custom_depth ?? ''}
                                  onChange={(e) => setDim(c.id, 'custom_depth', e.target.value)}
                                  onBlur={() => persistDim(c.id)}
                                />
                              </div>
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-zinc-300">{currency.format(r2(unit))}</td>
                            <td className="py-2 pr-3 text-right tabular-nums text-zinc-200">{currency.format(r2(unit * c.quantity))}</td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                className={`${iconButtonClass} hover:bg-red-950/60 hover:text-red-300`}
                                onClick={() => void handleDeleteCabinet(c.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* 3. Buyouts */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Prefab & Vendor Buyouts</h2>
                <button type="button" className={secondaryButtonClass} onClick={() => { setBuyoutModal(null); setBuyoutOpen(true); }}>
                  <Plus className="h-4 w-4" />
                  Add Buyout
                </button>
              </div>

              {buyouts.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">No buyout lines.</p>
              ) : (
                <div className="space-y-3">
                  {buyouts.map((b) => (
                    <div key={b.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-zinc-200">{b.description}</p>
                          <Badge className={`mt-1 ${buyoutCategoryBadge(b.category)}`}>{buyoutCategoryLabel(b.category)}</Badge>
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          <button
                            type="button"
                            className={iconButtonClass}
                            title="Edit"
                            onClick={() => { setBuyoutModal(b); setBuyoutOpen(true); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className={`${iconButtonClass} hover:bg-red-950/60 hover:text-red-300`}
                            onClick={() => void handleDeleteBuyout(b.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Invoice {currency.format(b.vendor_invoice_cost)} · {b.margin_percent}% margin</span>
                        <span className="tabular-nums text-zinc-200">{currency.format(r2(b.retail))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Summary */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Financial Rollup</h2>
              {summary && (
                <div className="space-y-2 text-sm">
                  <Row label="Direct Shop Materials" value={summary.shop_materials_total} />
                  <Row label="Direct Shop Labor" value={summary.shop_labor_total} sub={`${r2(summary.shop_labor_hours)} bench hrs`} />
                  <Row label="Vendor Buyout Invoices" value={summary.buyout_cost_total} />
                  <Divider />
                  <Row label="Total Shop Cost" value={summary.total_job_cost} bold />
                  <Row label="Net Gross Profit" value={summary.total_profit} bold accent="text-emerald-400" />
                  <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-800/40 p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-zinc-300">Final Proposal Retail</span>
                      <span className="text-xl font-bold tabular-nums text-emerald-400">
                        {currency.format(r2(summary.total_proposal_retail))}
                      </span>
                    </div>
                    <p className="mt-1 text-right text-xs text-zinc-500">
                      {r2(summary.blended_margin_percent)}% blended margin
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2 print:hidden">
                <button type="button" className={primaryButtonClass} onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Save
                </button>
                <div className="flex gap-2">
                  <button type="button" className={`${secondaryButtonClass} flex-1`} onClick={handleDuplicate}>
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </button>
                  <button type="button" className={`${secondaryButtonClass} flex-1`} onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {addCabinetOpen && (
        <AddCabinetModal
          catalog={catalog}
          onClose={() => setAddCabinetOpen(false)}
          onAdd={(sku) => void handleAddCabinet(sku)}
        />
      )}

      {buyoutOpen && (
        <BuyoutModal
          buyout={buyoutModal}
          defaultMargin={quote.prefab_margin_percent}
          onClose={() => setBuyoutOpen(false)}
          onSave={(b) => void handleSaveBuyout(b)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Quote"
          message={`Are you sure you want to delete "${quote.job_name}"? This cannot be undone.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function Row({ label, value, sub, bold, accent }: { label: string; value: number; sub?: string; bold?: boolean; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-zinc-400">
        {label}
        {sub && <span className="ml-1 text-xs text-zinc-500">({sub})</span>}
      </span>
      <span className={`tabular-nums ${bold ? 'font-semibold' : ''} ${accent ?? 'text-zinc-200'}`}>
        {currency.format(r2(value))}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="my-1 border-t border-zinc-800" />;
}

function toQuoteCabinet(c: QuoteCabinetLine): QuoteCabinet {
  return {
    id: c.id,
    quote_id: c.quote_id,
    cabinet_sku: c.cabinet_sku,
    quantity: c.quantity,
    custom_width: c.custom_width,
    custom_height: c.custom_height,
    custom_depth: c.custom_depth,
    notes: c.notes,
  };
}
