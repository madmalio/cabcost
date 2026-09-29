import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MaterialsScreen from './components/MaterialsScreen';
import ProfilesScreen from './components/ProfilesScreen';
import CatalogScreen from './components/CatalogScreen';
import QuotesScreen from './components/QuotesScreen';
import ShopSettingsScreen from './components/ShopSettingsScreen';
import type { ScreenKey } from './components/Sidebar';

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>('materials');

  return (
    <div className="flex h-full">
      <Sidebar active={screen} onNavigate={setScreen} />
      <main className="flex-1 overflow-hidden bg-zinc-950">
        {screen === 'materials' && <MaterialsScreen />}
        {screen === 'profiles' && <ProfilesScreen />}
        {screen === 'catalog' && <CatalogScreen />}
        {screen === 'quotes' && <QuotesScreen />}
        {screen === 'settings' && <ShopSettingsScreen />}
      </main>
    </div>
  );
}
