import React, { useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import { type PersonalizationData } from '../data/personalization';
import { SectionOneApology } from '../components/SectionOneApology';
import { SectionTwoChatMemories } from '../components/SectionTwoChatMemories';
import { SectionThreePromises } from '../components/SectionThreePromises';
import { usePersonalization } from '../context/PersonalizationContext';

interface AdminPreviewModalProps {
  draftData: PersonalizationData;
  onClose: () => void;
}

export const AdminPreviewModal: React.FC<AdminPreviewModalProps> = ({ draftData, onClose }) => {
  const { setPreviewData } = usePersonalization();

  // Inject draft data into context during preview, reset on close
  useEffect(() => {
    setPreviewData(draftData);
    return () => {
      setPreviewData(null);
    };
  }, [draftData, setPreviewData]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex flex-col">
      {/* Sticky top preview indicator bar */}
      <div className="sticky top-0 z-50 bg-[#6D28D9] text-white px-4 py-2.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-200 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            Draft Preview Mode — Not Visible to the Public
          </span>
        </div>

        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Exit Preview</span>
        </button>
      </div>

      {/* Preview Content Area */}
      <div className="flex-1 bg-[#FBF7FF] text-[#4B315F] font-sans antialiased overflow-x-hidden">
        <main className="flex flex-col items-center w-full min-h-screen">
          <SectionOneApology />
          <SectionTwoChatMemories />
          <SectionThreePromises />
        </main>
      </div>
    </div>
  );
};
