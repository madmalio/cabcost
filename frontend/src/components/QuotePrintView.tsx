import type {
  Cabinet,
  CabinetCostBreakdown,
  FinancialSummary,
  Quote,
  QuoteBuyoutLine,
  QuoteCabinetLine,
} from '../constants';
import { buyoutCategoryLabel, retailFromCost } from '../constants';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const r2 = (n: number) => Math.round(n * 100) / 100;

interface QuotePrintViewProps {
  quote: Quote;
  cabinets: QuoteCabinetLine[];
  buyouts: QuoteBuyoutLine[];
  summary: FinancialSummary | null;
  costs: Record<number, CabinetCostBreakdown>;
  catalogBySku: Record<string, Cabinet>;
}

function dimensions(line: QuoteCabinetLine, base: Cabinet | undefined): string {
  const w = line.custom_width ?? base?.width;
  const h = line.custom_height ?? base?.height;
  const d = line.custom_depth ?? base?.depth;
  if (w == null || h == null || d == null) return '—';
  return `${w} × ${h} × ${d}`;
}

export default function QuotePrintView({
  quote,
  cabinets,
  buyouts,
  summary,
  costs,
  catalogBySku,
}: QuotePrintViewProps) {
  const total = summary ? r2(summary.total_proposal_retail) : 0;
  const prepared = quote.updated_at ? new Date(quote.updated_at) : new Date();

  return (
    <div className="hidden print:block text-black">
      <div className="mx-auto max-w-4xl px-2 py-2">
        <header className="flex items-start justify-between border-b-2 border-black pb-4">
          <div>
            <p className="text-lg font-bold uppercase tracking-widest">CabCost</p>
            <p className="text-sm text-gray-600">Cabinet Estimate</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Quote #{quote.id}</p>
            <p className="text-gray-600">
              {prepared.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prepared For</p>
            <p className="mt-1 text-base font-semibold">{quote.client_name || '—'}</p>
            {quote.client_phone && <p className="text-gray-600">{quote.client_phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Project</p>
            <p className="mt-1 text-base font-semibold">{quote.job_name || 'Untitled Quote'}</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cabinet Schedule</h2>
          {cabinets.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No cabinets on this estimate.</p>
          ) : (
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-400 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-3 font-semibold">Qty</th>
                  <th className="py-2 pr-3 font-semibold">Description</th>
                  <th className="py-2 pr-3 font-semibold">Dimensions (W × H × D)</th>
                  <th className="py-2 pr-3 text-right font-semibold">Unit Price</th>
                  <th className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {cabinets.map((c) => {
                  const unitShop = costs[c.id]?.total_shop_cost ?? c.unit_shop_cost;
                  const unitRetail = r2(retailFromCost(unitShop, quote.target_margin_percent));
                  const lineTotal = r2(unitRetail * c.quantity);
                  return (
                    <tr key={c.id} className="break-inside-avoid border-b border-gray-200">
                      <td className="py-2 pr-3 tabular-nums">{c.quantity}</td>
                      <td className="py-2 pr-3">
                        <span className="font-medium">{c.catalog_name || c.cabinet_sku}</span>
                        <span className="ml-2 font-mono text-xs text-gray-500">{c.cabinet_sku}</span>
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-gray-700">
                        {dimensions(c, catalogBySku[c.cabinet_sku])}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{currency.format(unitRetail)}</td>
                      <td className="py-2 text-right tabular-nums">{currency.format(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {buyouts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vendor &amp; Prefab Items</h2>
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-400 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-3 font-semibold">Description</th>
                  <th className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {buyouts.map((b) => (
                  <tr key={b.id} className="break-inside-avoid border-b border-gray-200">
                    <td className="py-2 pr-3">
                      <span className="font-medium">{b.description}</span>
                      <span className="ml-2 text-xs text-gray-500">{buyoutCategoryLabel(b.category)}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{currency.format(r2(b.retail))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="mt-8 flex justify-end break-inside-avoid">
          <div className="w-64">
            <div className="flex items-baseline justify-between border-t-2 border-black pt-2">
              <span className="text-sm font-semibold uppercase tracking-wide">Total Estimate</span>
              <span className="text-lg font-bold tabular-nums">{currency.format(total)}</span>
            </div>
          </div>
        </section>

        {quote.notes && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{quote.notes}</p>
          </section>
        )}

        <footer className="mt-10 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">
          Estimate generated by CabCost · {prepared.toLocaleDateString()}
        </footer>
      </div>
    </div>
  );
}
