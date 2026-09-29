import { Boxes, Cog, Hammer, BookOpen, ClipboardList } from 'lucide-react';

export type ScreenKey = 'materials' | 'profiles' | 'catalog' | 'quotes' | 'settings';

interface SidebarProps {
  active: ScreenKey;
  onNavigate: (screen: ScreenKey) => void;
}

interface NavItem {
  key: ScreenKey | 'catalog' | 'quotes';
  label: string;
  icon: typeof Boxes;
  available: boolean;
  badge?: string;
}

const items: NavItem[] = [
  { key: 'materials', label: 'Materials & Hardware', icon: Boxes, available: true },
  { key: 'profiles', label: 'Construction Profiles', icon: Cog, available: true },
  { key: 'catalog', label: 'Cabinet Catalog', icon: BookOpen, available: true },
  { key: 'quotes', label: 'Job Quotes', icon: ClipboardList, available: true },
  { key: 'settings', label: 'Shop Rates & Overhead', icon: Hammer, available: true },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 print:hidden">
      <div className="flex h-14 items-center gap-2.5 border-b border-zinc-800 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-900">
          <Boxes className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-wide text-zinc-100">CabCost</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          if (!item.available) {
            return (
              <div
                key={item.key}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                <span className="rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  Coming Soon
                </span>
              </div>
            );
          }
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key as ScreenKey)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
