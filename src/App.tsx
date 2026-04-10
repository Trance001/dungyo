import { useEffect } from 'react';
import { HomePage } from '@/pages/HomePage';
import { useCharacterStore } from '@/stores/character-store';

export default function App() {
  const loadFromStorage = useCharacterStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return <HomePage />;
}
