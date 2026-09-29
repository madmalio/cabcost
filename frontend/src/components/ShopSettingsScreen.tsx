import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../api';
import type { ShopSettings } from '../constants';
import { inputClass, labelClass, primaryButtonClass } from './ui';

interface FieldProps {
  label: string;
  hint: string;
  value: string;
  suffix: string;
  onChange: (value: string) => void;
}

function Field({ label, hint, value, suffix, onChange }: FieldProps) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center">
        <input
          type="number"
          min="0"
          step="0.01"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="ml-3 w-16 shrink-0 text-sm text-zinc-500">{suffix}</span>
      </div>
      <p className="mt-1.5 text-xs text-zinc-600">{hint}</p>
    </div>
  );
}

export default function ShopSettingsScreen() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loadedLaborRate, setLoadedLaborRate] = useState('55.00');
  const [finishingRate, setFinishingRate] = useState('4.00');
  const [edgebandMin, setEdgebandMin] = useState('1.5');
  const [marginPercent, setMarginPercent] = useState('30.0');
  const [suppliesPercent, setSuppliesPercent] = useState('3.0');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await api.getShopSettings();
      setSettings(s);
      setLoadedLaborRate(s.loaded_labor_rate.toString());
      setFinishingRate(s.finishing_labor_rate_sqft.toString());
      setEdgebandMin(s.manual_edgeband_min_per_ft.toString());
      setMarginPercent(s.default_margin_percent.toString());
      setSuppliesPercent(s.shop_supplies_percent.toString());
    } catch (err) {
      setStatus({ type: 'error', text: String(err) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setStatus(null);
    try {
      await api.saveShopSettings({
        id: settings.id,
        loaded_labor_rate: parseFloat(loadedLaborRate) || 0,
        finishing_labor_rate_sqft: parseFloat(finishingRate) || 0,
        manual_edgeband_min_per_ft: parseFloat(edgebandMin) || 0,
        default_margin_percent: parseFloat(marginPercent) || 0,
        shop_supplies_percent: parseFloat(suppliesPercent) || 0,
      });
      setStatus({ type: 'success', text: 'Settings saved.' });
      await load();
    } catch (err) {
      setStatus({ type: 'error', text: String(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-zinc-800 px-8 py-6">
        <h1 className="text-xl font-semibold text-zinc-100">Shop Rates & Overhead</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set the labor rates, edgebanding time, and overhead defaults applied across your estimates.
        </p>
      </header>

      <div className="flex-1 overflow-auto px-8 py-6">
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Labor Rates</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field
                label="Loaded Labor Rate"
                hint="Fully burdened shop labor rate per hour."
                value={loadedLaborRate}
                suffix="$ / hr"
                onChange={setLoadedLaborRate}
              />
              <Field
                label="Finishing Labor Rate"
                hint="Labor cost applied per square foot of finishing."
                value={finishingRate}
                suffix="$ / sq ft"
                onChange={setFinishingRate}
              />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Overhead & Margin</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field
                label="Edgebanding Labor Time"
                hint="Manual edgebanding time per linear foot."
                value={edgebandMin}
                suffix="min / ft"
                onChange={setEdgebandMin}
              />
              <Field
                label="Shop Supplies"
                hint="Percentage added to cover consumables and supplies."
                value={suppliesPercent}
                suffix="%"
                onChange={setSuppliesPercent}
              />
              <Field
                label="Default Margin"
                hint="Default profit margin applied to estimates."
                value={marginPercent}
                suffix="%"
                onChange={setMarginPercent}
              />
            </div>
          </div>

          {status && (
            <p
              className={`text-sm ${
                status.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {status.text}
            </p>
          )}

          <div className="flex justify-end">
            <button type="submit" className={primaryButtonClass} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
