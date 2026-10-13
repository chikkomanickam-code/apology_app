import React, { useState, useEffect } from 'react';
import { PersonalizationProvider } from './context/PersonalizationContext';
import { SectionOneApology } from './components/SectionOneApology';
import { SectionTwoChatMemories } from './components/SectionTwoChatMemories';
import { SectionThreePromises } from './components/SectionThreePromises';
import { LiveEditorModal } from './components/LiveEditorModal';

const AppContent: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Listen for PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setCanInstall(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstall(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7FF] text-[#4B315F] font-sans antialiased overflow-x-hidden selection:bg-[#E6D6FA] selection:text-[#6D28D9]">
      <main className="flex flex-col items-center w-full">
        {/* SECTION 1: APOLOGY 💌 */}
        <SectionOneApology />

        {/* SECTION 2: OUR CHAT MEMORIES 🫶 */}
        <SectionTwoChatMemories />

        {/* SECTION 3: MY PROMISES TO YOU ♾️ */}
        <SectionThreePromises onInstall={handleInstall} canInstall={canInstall} />
      </main>

      {/* Live In-Browser Editor for Personalizing Words & Photos */}
      <LiveEditorModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PersonalizationProvider>
      <AppContent />
    </PersonalizationProvider>
  );
};

export default App;
