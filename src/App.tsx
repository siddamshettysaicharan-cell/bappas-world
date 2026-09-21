/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { verifySupabaseConnection } from './lib/supabase';

export default function App() {
  useEffect(() => {
    // Verify Supabase connection on startup without modifying game UI or gameplay
    verifySupabaseConnection();
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-[#0d0604] select-none">
      <GameCanvas />
    </main>
  );
}

