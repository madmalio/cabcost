import { useState, useMemo } from 'react';
import Modal from './Modal';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './ui';
import type { Assembly, Hardware, Material } from '../constants';
import { PANEL_TYPES, FRAME_JOINERY, unitLabel } from '../constants';

const ASSEMBLY_TYPES = [
  { value: 'box', label: 'Box' },
  { value: 'door', label: 'Door' },
  { value: 'drawer_front', label: 'Drawer Front' },
  { value: 'drawer_box', label: 'Drawer Box' },
] as const;

const STYLES = [
  { value: 'face_frame', label: 'Face Frame' },
  { value: 'frameless', label: 'Frameless' },
] as const;

interface AssemblyModalProps {
  assembly: Assembly | null;
  materials: Material[];
  hardware: Hardware[];
  onClose: () => void;
  onSave: (assembly: Assembly) => void;
}

function materialSelect(all: Material[], roles: string[]) {
  return all
    .filter((m) => roles.includes(m.role))
    .map((m) => ({ id: m.id, name: `${m.name} (${unitLabel(m.unit)})` }));
}

function nullableId(v: string | number): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = typeof v === 'string' ? parseInt(v, 10) : v;
  return Number.isNaN(n) ? undefined : n;
}

export default function AssemblyModal({ assembly, materials, hardware, onClose, onSave }: AssemblyModalProps) {
  const [name, setName] = useState(assembly?.name ?? '');
  const [type, setType] = useState(assembly?.type ?? 'box');
  const [style, setStyle] = useState(assembly?.construction_style ?? 'face_frame');

  const [coreMaterialID, setCoreMaterialID] = useState(assembly?.core_material_id?.toString() ?? '');
  const [backMaterialID, setBackMaterialID] = useState(assembly?.back_material_id?.toString() ?? '');
  const [panelMaterialID, setPanelMaterialID] = useState(assembly?.panel_material_id?.toString() ?? '');
  const [faceLumberID, setFaceLumberID] = useState(assembly?.face_lumber_id?.toString() ?? '');
  const [edgebandID, setEdgebandID] = useState(assembly?.edgeband_id?.toString() ?? '');
  const [hardwareID, setHardwareID] = useState(assembly?.hardware_id?.toString() ?? '');

  const [isOutsourced, setIsOutsourced] = useState(assembly?.is_outsourced ?? false);
  const [requiresFinish, setRequiresFinish] = useState(assembly?.requires_finish ?? false);
  const [requiresEdgeband, setRequiresEdgeband] = useState(assembly?.requires_edgeband ?? false);
  const [panelType, setPanelType] = useState(assembly?.panel_type ?? 'flat');
  const [frameJoinery, setFrameJoinery] = useState(assembly?.frame_joinery ?? 'cope_and_stick');
  const [finishLabor, setFinishLabor] = useState(assembly?.finish_labor_hours?.toString() ?? '');
  const [prepLabor, setPrepLabor] = useState(assembly?.prep_labor_hours?.toString() ?? '');
  const [panelPrepLabor, setPanelPrepLabor] = useState(assembly?.panel_prep_labor_hours?.toString() ?? '');
  const [buildLabor, setBuildLabor] = useState(assembly?.build_labor_hours?.toString() ?? '');
  const [isDefault, setIsDefault] = useState(assembly?.is_default ?? false);

  const [error, setError] = useState('');

  const isBox = type === 'box';
  const isDoor = type === 'door';
  const isFront = type === 'drawer_front';
  const isDrawerBox = type === 'drawer_box';

  const coreOptions = useMemo(() => {
    switch (type) {
      case 'box': return materialSelect(materials, ['box_core']);
      case 'door':
      case 'drawer_front': return materialSelect(materials, ['door_frame', 'slab_sheet', 'frame_lumber']);
      case 'drawer_box': return materialSelect(materials, ['drawer_side']);
      default: return [];
    }
  }, [type, materials]);

  const backOptions = useMemo(() => {
    switch (type) {
      case 'box': return materialSelect(materials, ['box_back']);
      case 'drawer_box': return materialSelect(materials, ['box_back', 'drawer_bottom']);
      default: return [];
    }
  }, [type, materials]);

  const panelOptions = useMemo(() => {
    if (!(isDoor || isFront)) return [];
    switch (panelType) {
      case 'raised_solid': return materialSelect(materials, ['frame_lumber', 'door_frame']);
      case 'raised_sheet': return materialSelect(materials, ['slab_sheet']);
      default: return materialSelect(materials, ['door_panel']);
    }
  }, [isDoor, isFront, panelType, materials]);

  const faceLumberOptions = useMemo(
    () => (isBox && style === 'face_frame' ? materialSelect(materials, ['frame_lumber']) : []),
    [isBox, style, materials],
  );

  const edgebandOptions = useMemo(
    () => (isBox && style === 'frameless' ? materialSelect(materials, ['edgeband']) : []),
    [isBox, style, materials],
  );

  const hardwareOptions = useMemo(() => {
    if (isDoor) return hardware.filter((h) => h.category === 'hinge');
    if (isDrawerBox) return hardware.filter((h) => h.category === 'slide');
    return [];
  }, [isDoor, isDrawerBox, hardware]);

  const showToggle = isDoor || isFront || isDrawerBox;
  const showMaterials = isBox || (showToggle && !isOutsourced);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    const prep = parseFloat(prepLabor) || 0;
    const build = parseFloat(buildLabor) || 0;
    const finish = parseFloat(finishLabor) || 0;
    const panelPrep = parseFloat(panelPrepLabor) || 0;
    if (prep < 0 || build < 0 || finish < 0 || panelPrep < 0) {
      setError('Labor hours must be non-negative.');
      return;
    }
    const coreID = showMaterials ? nullableId(coreMaterialID) : undefined;
    if (showMaterials && coreID === undefined) {
      setError('Core / frame material is required.');
      return;
    }
    onSave({
      id: assembly?.id ?? 0,
      name: name.trim(),
      type,
      construction_style: style,
      core_material_id: coreID,
      back_material_id: showMaterials && (isBox || isDrawerBox) ? nullableId(backMaterialID) : undefined,
      panel_material_id: showMaterials && (isDoor || isFront) ? nullableId(panelMaterialID) : undefined,
      face_lumber_id: isBox && style === 'face_frame' ? nullableId(faceLumberID) : undefined,
      edgeband_id: isBox && style === 'frameless' ? nullableId(edgebandID) : undefined,
      hardware_id: showMaterials && (isDoor || isDrawerBox) ? nullableId(hardwareID) : undefined,
      is_outsourced: isOutsourced,
      requires_finish: requiresFinish,
      requires_edgeband: requiresEdgeband,
      panel_type: isDoor || isFront ? panelType : 'flat',
      frame_joinery: isDoor || isFront ? frameJoinery : 'cope_and_stick',
      finish_labor_hours: finish,
      prep_labor_hours: prep,
      panel_prep_labor_hours: isDoor || isFront ? panelPrep : 0,
      build_labor_hours: build,
      is_default: isDefault,
      created_at: assembly?.created_at ?? '',
    });
  };

  const laborUnit = isDoor ? 'door' : isFront ? 'front' : 'box';

  return (
    <Modal title={assembly ? 'Edit Assembly' : 'Add Assembly'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="assembly-name">Name</label>
          <input
            id="assembly-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. Paint-Grade Shaker Door'
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="assembly-type">Assembly Type</label>
            <select
              id="assembly-type"
              className={inputClass}
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCoreMaterialID('');
                setBackMaterialID('');
                setPanelMaterialID('');
                setFaceLumberID('');
                setEdgebandID('');
                setHardwareID('');
                setIsOutsourced(false);
                setRequiresFinish(false);
                setRequiresEdgeband(false);
                setPanelType('flat');
                setFrameJoinery('cope_and_stick');
                setPanelPrepLabor('');
              }}
            >
              {ASSEMBLY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {isBox && (
            <div>
              <label className={labelClass} htmlFor="assembly-style">Construction Style</label>
              <select
                id="assembly-style"
                className={inputClass}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {showToggle && (
          <div>
            <label className={labelClass}>Build Method</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOutsourced(false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  !isOutsourced ? 'border-zinc-500 bg-zinc-700 text-zinc-100' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                In-House Build
              </button>
              <button
                type="button"
                onClick={() => setIsOutsourced(true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isOutsourced ? 'border-zinc-500 bg-zinc-700 text-zinc-100' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                Outsourced (Buyout)
              </button>
            </div>
          </div>
        )}

        {showMaterials && (
          <>
            <div>
              <label className={labelClass} htmlFor="assembly-core">
                {isDoor ? 'Frame / Slab Material' : isFront ? 'Frame / Slab Material' : isDrawerBox ? 'Side Material' : 'Core Material'}
              </label>
              <select
                id="assembly-core"
                className={inputClass}
                value={coreMaterialID}
                onChange={(e) => setCoreMaterialID(e.target.value)}
              >
                <option value="">— Select —</option>
                {coreOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            {(isBox || isDrawerBox) && (
              <div>
                <label className={labelClass} htmlFor="assembly-back">
                  {isDrawerBox ? 'Bottom Material' : 'Back Material'}
                </label>
                <select
                  id="assembly-back"
                  className={inputClass}
                  value={backMaterialID}
                  onChange={(e) => setBackMaterialID(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {backOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}

            {(isDoor || isFront) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} htmlFor="assembly-panel-type">Panel Style</label>
                    <select
                      id="assembly-panel-type"
                      className={inputClass}
                      value={panelType}
                      onChange={(e) => {
                        setPanelType(e.target.value);
                        setPanelMaterialID('');
                      }}
                    >
                      {PANEL_TYPES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="assembly-frame-joinery">Frame Joinery</label>
                    <select
                      id="assembly-frame-joinery"
                      className={inputClass}
                      value={frameJoinery}
                      onChange={(e) => setFrameJoinery(e.target.value)}
                    >
                      {FRAME_JOINERY.map((j) => (
                        <option key={j.value} value={j.value}>{j.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="assembly-panel">
                    {panelType === 'raised_solid'
                      ? 'Solid Wood Panel Material'
                      : panelType === 'raised_sheet'
                        ? 'Raised Panel Material (3/4" sheet)'
                        : 'Panel Material (1/4" sheet)'}
                  </label>
                  <select
                    id="assembly-panel"
                    className={inputClass}
                    value={panelMaterialID}
                    onChange={(e) => setPanelMaterialID(e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {panelOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                {panelType === 'raised_solid' && (
                  <div>
                    <label className={labelClass} htmlFor="assembly-panel-prep">
                      Panel Glue &amp; Clamp Labor (hrs / {laborUnit})
                    </label>
                    <input
                      id="assembly-panel-prep"
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={panelPrepLabor}
                      onChange={(e) => setPanelPrepLabor(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {isBox && style === 'face_frame' && (
              <div>
                <label className={labelClass} htmlFor="assembly-face-lumber">Face Frame Lumber</label>
                <select
                  id="assembly-face-lumber"
                  className={inputClass}
                  value={faceLumberID}
                  onChange={(e) => setFaceLumberID(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {faceLumberOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isBox && style === 'frameless' && (
              <div>
                <label className={labelClass} htmlFor="assembly-edgeband">Edgeband</label>
                <select
                  id="assembly-edgeband"
                  className={inputClass}
                  value={edgebandID}
                  onChange={(e) => setEdgebandID(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {edgebandOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}

            {(isDoor || isDrawerBox) && (
              <div>
                <label className={labelClass} htmlFor="assembly-hardware">
                  {isDoor ? 'Hinge Hardware' : 'Slide Hardware'}
                </label>
                <select
                  id="assembly-hardware"
                  className={inputClass}
                  value={hardwareID}
                  onChange={(e) => setHardwareID(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {hardwareOptions.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} ({h.unit})</option>
                  ))}
                </select>
              </div>
            )}

            {isDrawerBox && (
              <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                <label className="flex items-center gap-2.5 text-sm text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-zinc-100"
                    checked={requiresFinish}
                    onChange={(e) => setRequiresFinish(e.target.checked)}
                  />
                  Requires In-Shop Finishing
                </label>
                <label className="flex items-center gap-2.5 text-sm text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-zinc-100"
                    checked={requiresEdgeband}
                    onChange={(e) => setRequiresEdgeband(e.target.checked)}
                  />
                  Requires Edgeband
                </label>
                {requiresFinish && (
                  <div>
                    <label className={labelClass} htmlFor="assembly-finish-labor">Finish Labor (hrs / box)</label>
                    <input
                      id="assembly-finish-labor"
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={finishLabor}
                      onChange={(e) => setFinishLabor(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          {showToggle && isOutsourced ? (
            <div>
              <label className={labelClass} htmlFor="assembly-prep-labor">Prep & Bore Labor (hrs / {laborUnit})</label>
              <input
                id="assembly-prep-labor"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={prepLabor}
                onChange={(e) => setPrepLabor(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className={labelClass} htmlFor="assembly-build-labor">Build Labor (hrs / {laborUnit})</label>
              <input
                id="assembly-build-labor"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={buildLabor}
                onChange={(e) => setBuildLabor(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2.5 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-zinc-100"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              Default Assembly
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass}>
            {assembly ? 'Save Changes' : 'Add Assembly'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
