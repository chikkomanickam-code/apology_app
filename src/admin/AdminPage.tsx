import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getDraftScrapbook, checkIsOwner } from '../lib/scrapbookApi';
import { AdminLogin } from './AdminLogin';
import { AdminEditor } from './AdminEditor';
import { AdminPreviewModal } from './AdminPreviewModal';
import { type PersonalizationData } from '../data/personalization';
import { Heart, Loader2, ShieldAlert, LogOut, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface AdminPageProps {
  onBackToPublic: () => void;
  onPublishedSuccess: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToPublic, onPublishedSuccess }) => {
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [draftData, setDraftData] = useState<PersonalizationData | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PersonalizationData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOwnerDraft = useCallback(async () => {
    setLoadError(null);
    try {
      const { data, updatedAt, error } = await getDraftScrapbook();
      if (data) {
        setDraftData(data);
        setLastPublishedAt(updatedAt);
      } else if (error) {
        setLoadError(error.message);
      }
    } catch (err: any) {
      setLoadError(err.message || 'Error loading draft');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured()) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(currentSession);

        if (currentSession?.user) {
          const ownerStatus = await checkIsOwner();
          if (!mounted) return;
          setIsOwner(ownerStatus);

          if (ownerStatus) {
            await loadOwnerDraft();
          }
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          setIsAuthLoading(true);
          const ownerStatus = await checkIsOwner();
          setIsOwner(ownerStatus);
          if (ownerStatus) {
            await loadOwnerDraft();
          }
          setIsAuthLoading(false);
        } else {
          setIsOwner(null);
          setDraftData(null);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadOwnerDraft]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsOwner(null);
    setDraftData(null);
  };

  // 1. Initial Auth Loading Spinner
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FBF7FF] flex flex-col items-center justify-center text-[#4B315F] p-4">
        <div className="w-16 h-16 rounded-full bg-[#E6D6FA]/50 border border-[#E6D6FA] flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 fill-[#6D28D9] text-[#6D28D9] animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6D28D9]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying admin authorization...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Show Login screen
  if (!session?.user) {
    return (
      <AdminLogin
        onLoginSuccess={() => {}}
        onBackToHome={onBackToPublic}
      />
    );
  }

  // 3. Authenticated but NOT in scrapbook_owners
  if (isOwner === false) {
    return (
      <div className="min-h-screen bg-[#FBF7FF] flex flex-col items-center justify-center p-4 text-[#4B315F]">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="font-serif text-2xl font-bold text-[#4B315F]">
            Access Denied
          </h2>

          <p className="text-xs sm:text-sm text-[#4B315F]/70 leading-relaxed">
            You are logged in as <span className="font-mono font-semibold text-[#6D28D9]">{session.user.email}</span>, but this account is not registered in the <code className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded text-[11px]">scrapbook_owners</code> table.
          </p>

          <p className="text-[11px] text-[#4B315F]/50">
            Please register your account user ID in your Supabase database table or sign in with the owner email.
          </p>

          <div className="flex gap-3 pt-3">
            <button
              onClick={onBackToPublic}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#E6D6FA] text-xs font-semibold text-[#4B315F] hover:bg-purple-50 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Site</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Owner: Render Admin Editor
  if (draftData) {
    return (
      <>
        <AdminEditor
          initialData={draftData}
          userEmail={session.user.email || 'Owner'}
          lastPublishedAt={lastPublishedAt}
          onPreview={(data) => setPreviewData(data)}
          onSignOut={handleSignOut}
          onBackToPublic={onBackToPublic}
          onPublishedSuccess={() => {
            onPublishedSuccess();
            setLastPublishedAt(new Date().toISOString());
          }}
        />

        {previewData && (
          <AdminPreviewModal
            draftData={previewData}
            onClose={() => setPreviewData(null)}
          />
        )}
      </>
    );
  }

  // 5. Loading Error
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#FBF7FF] flex flex-col items-center justify-center text-[#4B315F] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-rose-200 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="font-serif font-bold text-lg text-rose-800">
            Could not load draft
          </h2>
          <p className="text-xs text-rose-600">{loadError}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={loadOwnerDraft}
              className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={onBackToPublic}
              className="px-4 py-2 rounded-xl border border-[#E6D6FA] text-xs font-medium cursor-pointer"
            >
              Back to Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7FF] flex flex-col items-center justify-center text-[#4B315F] p-4">
      <Loader2 className="w-6 h-6 animate-spin text-[#6D28D9] mb-2" />
      <span className="text-xs">Loading draft content...</span>
    </div>
  );
};
