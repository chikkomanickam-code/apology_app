import React, { useState, useEffect } from 'react';
import { PersonalizationProvider, usePersonalization } from './context/PersonalizationContext';
import { SectionOneApology } from './components/SectionOneApology';
import { SectionTwoChatMemories } from './components/SectionTwoChatMemories';
import { SectionThreePromises } from './components/SectionThreePromises';
import { AdminPage } from './admin/AdminPage';
import { Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isLoading, refreshPublished } = usePersonalization();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Client-side route changes listener
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated Private Admin Route (/admin)
  if (currentPath === '/admin' || currentPath === '/admin/') {
    return (
      <AdminPage
        onBackToPublic={() => navigate('/')}
        onPublishedSuccess={refreshPublished}
      />
    );
  }

  // Romantic loading screen for initial content load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF7FF] flex flex-col items-center justify-center p-4 text-[#4B315F]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#E6D6FA] via-[#F8D9EB] to-[#FFFFFF] border border-[#E6D6FA] flex items-center justify-center mb-4 shadow-sm animate-gentle-float">
          <Heart className="w-8 h-8 fill-[#6D28D9] text-[#6D28D9] animate-heart-pulse" />
        </div>
        <p className="font-serif italic text-sm text-[#4B315F]/80">
          Opening a little place for you... 💜
        </p>
      </div>
    );
  }

  // Public View: Only the published romantic scrapbook
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
