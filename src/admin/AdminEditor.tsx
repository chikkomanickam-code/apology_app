import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Heart,
  MessageSquare,
  Shield,
  Save,
  Send,
  Eye,
  RotateCcw,
  LogOut,
  Upload,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  AlertCircle,
  Loader2,
  Ear,
  MessageCircle,
  Sparkles,
  Smile,
  Flower2,
  Star,
  Coffee,
  Lock,
  Sun,
  Infinity as InfinityIcon,
  Gift,
  Compass,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import type { PersonalizationData, ChatMemory, PromiseItem } from '../data/personalization';
import {
  saveDraftScrapbook,
  publishDraftScrapbook,
  resetDraftToPublished,
  uploadScrapbookImage,
  deleteScrapbookImage,
} from '../lib/scrapbookApi';

const AVAILABLE_ICONS = [
  { id: 'heart', label: 'Heart', icon: Heart },
  { id: 'ear', label: 'Listen', icon: Ear },
  { id: 'message', label: 'Message', icon: MessageCircle },
  { id: 'shield', label: 'Respect', icon: Shield },
  { id: 'sparkles', label: 'Growth', icon: Sparkles },
  { id: 'smile', label: 'Kindness', icon: Smile },
  { id: 'flower', label: 'Flower', icon: Flower2 },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'coffee', label: 'Cozy', icon: Coffee },
  { id: 'lock', label: 'Trust', icon: Lock },
  { id: 'sun', label: 'Warmth', icon: Sun },
  { id: 'infinity', label: 'Forever', icon: InfinityIcon },
  { id: 'gift', label: 'Gift', icon: Gift },
  { id: 'compass', label: 'Guide', icon: Compass },
  { id: 'flame', label: 'Flame', icon: Flame },
];

interface AdminEditorProps {
  initialData: PersonalizationData;
  userEmail: string;
  lastPublishedAt: string | null;
  onPreview: (data: PersonalizationData) => void;
  onSignOut: () => void;
  onBackToPublic: () => void;
  onPublishedSuccess: () => void;
}

export const AdminEditor: React.FC<AdminEditorProps> = ({
  initialData,
  userEmail,
  lastPublishedAt,
  onPreview,
  onSignOut,
  onBackToPublic,
  onPublishedSuccess,
}) => {
  const [formData, setFormData] = useState<PersonalizationData>(initialData);
  const [activeTab, setActiveTab] = useState<'apology' | 'chats' | 'promises'>('apology');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [uploadingChatId, setUploadingChatId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeIconPickerIndex, setActiveIconPickerIndex] = useState<number | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. SAVE DRAFT
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const { error } = await saveDraftScrapbook(formData);
      if (error) {
        showToast('error', `Failed to save draft: ${error.message}`);
      } else {
        showToast('success', 'Draft saved successfully to cloud!');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error saving draft');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. PUBLISH CHANGES (ATOMIC)
  const handlePublish = async () => {
    const confirmPublish = window.confirm(
      'Are you ready to publish these changes? Your girlfriend will immediately see the updated version on the live site.'
    );
    if (!confirmPublish) return;

    setIsPublishing(true);
    try {
      // First save current form data to draft
      const { error: saveError } = await saveDraftScrapbook(formData);
      if (saveError) {
        showToast('error', `Save failed before publish: ${saveError.message}`);
        setIsPublishing(false);
        return;
      }

      // Then call atomic publish RPC
      const { error: publishError } = await publishDraftScrapbook();
      if (publishError) {
        showToast('error', `Publish failed: ${publishError.message}`);
      } else {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6D28D9', '#A78BFA', '#F8D9EB', '#FFFFFF'],
        });
        showToast('success', 'Published live to the website! 💜');
        onPublishedSuccess();
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error publishing content');
    } finally {
      setIsPublishing(false);
    }
  };

  // 3. RESET DRAFT TO PUBLISHED
  const handleResetToPublished = async () => {
    const confirmReset = window.confirm(
      'Are you sure you want to discard your draft edits and reset to the currently published version?'
    );
    if (!confirmReset) return;

    setIsResetting(true);
    try {
      const { data, error } = await resetDraftToPublished();
      if (error || !data) {
        showToast('error', `Failed to reset draft: ${error?.message || 'Unknown error'}`);
      } else {
        setFormData(data);
        showToast('success', 'Draft reverted to published version.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error resetting draft');
    } finally {
      setIsResetting(false);
    }
  };

  // Chat Image Upload to Supabase Storage
  const handleImageUpload = async (chatId: string, file: File) => {
    setUploadingChatId(chatId);
    try {
      const targetChat = formData.chatMemories.chats.find((c) => c.id === chatId);
      const { url, error } = await uploadScrapbookImage(
        file,
        targetChat?.caption || '',
        targetChat?.date || ''
      );

      if (error) {
        showToast('error', `Image upload failed: ${error.message}`);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        chatMemories: {
          ...prev.chatMemories,
          chats: prev.chatMemories.chats.map((chat) =>
            chat.id === chatId ? { ...chat, src: url } : chat
          ),
        },
      }));
      showToast('success', 'Photo uploaded to Supabase Storage!');
    } catch (err: any) {
      showToast('error', err.message || 'Error uploading image');
    } finally {
      setUploadingChatId(null);
    }
  };

  const handleDeleteChat = async (chat: ChatMemory) => {
    if (chat.src && chat.src.includes('scrapbook-media/')) {
      const parts = chat.src.split('scrapbook-media/');
      if (parts[1]) {
        await deleteScrapbookImage(parts[1]);
      }
    }
    setFormData((prev) => ({
      ...prev,
      chatMemories: {
        ...prev.chatMemories,
        chats: prev.chatMemories.chats.filter((c) => c.id !== chat.id),
      },
    }));
  };

  // Move helpers
  const moveItem = <T,>(list: T[], index: number, direction: 'up' | 'down'): T[] => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return list;
    const newList = [...list];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);
    return newList;
  };

  return (
    <div className="min-h-screen bg-[#FBF7FF] text-[#4B315F] font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-medium flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-purple-900 text-white border-purple-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6D6FA] px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPublic}
              className="p-1.5 rounded-full hover:bg-purple-50 text-[#6D28D9] transition cursor-pointer"
              title="Return to Public View"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-base sm:text-lg text-[#4B315F]">
                  Scrapbook Admin Editor
                </h1>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                  Owner
                </span>
              </div>
              <p className="text-[11px] text-[#4B315F]/60">
                Logged in as <span className="font-mono text-[#6D28D9]">{userEmail}</span>
                {lastPublishedAt && (
                  <span className="ml-2 hidden sm:inline">
                    • Published:{' '}
                    {new Date(lastPublishedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onPreview(formData)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E6D6FA] text-xs font-medium text-[#4B315F] hover:bg-purple-50 shadow-2xs transition cursor-pointer"
              title="Preview changes without publishing"
            >
              <Eye className="w-3.5 h-3.5 text-[#6D28D9]" />
              <span className="hidden sm:inline">Preview Draft</span>
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 border border-purple-200 text-xs font-semibold text-[#6D28D9] hover:bg-purple-200 shadow-2xs transition cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Draft</span>
            </button>

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white text-xs font-semibold shadow-md shadow-purple-900/20 hover:brightness-105 active:scale-95 transition cursor-pointer disabled:opacity-60"
            >
              {isPublishing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Publish Live</span>
            </button>

            <button
              onClick={handleResetToPublished}
              disabled={isResetting}
              className="p-1.5 rounded-xl text-[#4B315F]/70 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Reset Draft to Published"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onSignOut}
              className="p-1.5 rounded-xl text-[#4B315F]/70 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Editor Main Content */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-white rounded-2xl border border-[#E6D6FA] shadow-xs mb-6">
          <button
            onClick={() => setActiveTab('apology')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'apology'
                ? 'bg-[#6D28D9] text-white shadow-xs'
                : 'text-[#4B315F]/80 hover:bg-purple-50'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>1. Apology</span>
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'chats'
                ? 'bg-[#6D28D9] text-white shadow-xs'
                : 'text-[#4B315F]/80 hover:bg-purple-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>2. Chat Memories ({formData.chatMemories.chats.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('promises')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'promises'
                ? 'bg-[#6D28D9] text-white shadow-xs'
                : 'text-[#4B315F]/80 hover:bg-purple-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>3. Promises ({formData.promises.items.length})</span>
          </button>
        </div>

        {/* TAB 1: APOLOGY */}
        {activeTab === 'apology' && (
          <div className="space-y-6 bg-white p-5 sm:p-7 rounded-3xl border border-[#E6D6FA] shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={formData.recipientName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientName: e.target.value })
                  }
                  placeholder="e.g. Tasneem, My Love"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#A78BFA]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Top Pill Badge
                </label>
                <input
                  type="text"
                  value={formData.apology.topTag}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      apology: { ...formData.apology, topTag: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#A78BFA]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Main Heading
                </label>
                <input
                  type="text"
                  value={formData.apology.heading}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      apology: { ...formData.apology, heading: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#A78BFA]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.apology.subtitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      apology: { ...formData.apology, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#A78BFA]/50"
                />
              </div>
            </div>

            {/* Letter Paragraphs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold text-[#4B315F] uppercase tracking-wider">
                  Letter Paragraphs
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      apology: {
                        ...formData.apology,
                        letterParagraphs: [...formData.apology.letterParagraphs, ''],
                      },
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-[#6D28D9] text-xs font-semibold hover:bg-purple-100 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Paragraph</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.apology.letterParagraphs.map((para, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-[#E6D6FA] bg-[#FAF7FF] flex items-start gap-2.5"
                  >
                    <div className="flex flex-col gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            apology: {
                              ...formData.apology,
                              letterParagraphs: moveItem(
                                formData.apology.letterParagraphs,
                                idx,
                                'up'
                              ),
                            },
                          })
                        }
                        disabled={idx === 0}
                        className="p-1 rounded-md text-[#4B315F]/60 hover:text-[#6D28D9] disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            apology: {
                              ...formData.apology,
                              letterParagraphs: moveItem(
                                formData.apology.letterParagraphs,
                                idx,
                                'down'
                              ),
                            },
                          })
                        }
                        disabled={idx === formData.apology.letterParagraphs.length - 1}
                        className="p-1 rounded-md text-[#4B315F]/60 hover:text-[#6D28D9] disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={para}
                      onChange={(e) => {
                        const newParas = [...formData.apology.letterParagraphs];
                        newParas[idx] = e.target.value;
                        setFormData({
                          ...formData,
                          apology: {
                            ...formData.apology,
                            letterParagraphs: newParas,
                          },
                        })
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E6D6FA] bg-white text-xs sm:text-sm text-[#4B315F] focus:outline-hidden focus:ring-2 focus:ring-[#A78BFA]/50"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const newParas = formData.apology.letterParagraphs.filter((_, i) => i !== idx);
                        setFormData({
                          ...formData,
                          apology: {
                            ...formData.apology,
                            letterParagraphs: newParas,
                          },
                        });
                      }}
                      className="p-2 rounded-xl text-[#4B315F]/50 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer mt-1"
                      title="Delete Paragraph"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E6D6FA]/70">
              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Handwritten Note (Bottom of letter)
                </label>
                <input
                  type="text"
                  value={formData.apology.handwrittenNote}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      apology: { ...formData.apology, handwrittenNote: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Scroll Cue
                </label>
                <input
                  type="text"
                  value={formData.apology.scrollCue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      apology: { ...formData.apology, scrollCue: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHAT MEMORIES */}
        {activeTab === 'chats' && (
          <div className="space-y-6 bg-white p-5 sm:p-7 rounded-3xl border border-[#E6D6FA] shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={formData.chatMemories.heading}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chatMemories: { ...formData.chatMemories, heading: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={formData.chatMemories.subtitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chatMemories: { ...formData.chatMemories, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Chat Memories list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-bold text-[#4B315F] uppercase tracking-wider">
                  Memory Cards ({formData.chatMemories.chats.length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newChat: ChatMemory = {
                      id: `chat-${Date.now()}`,
                      src: '',
                      caption: 'A precious moment with you.',
                      date: 'Memory',
                      alt: 'Chat screenshot',
                    };
                    setFormData({
                      ...formData,
                      chatMemories: {
                        ...formData.chatMemories,
                        chats: [...formData.chatMemories.chats, newChat],
                      },
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 text-[#6D28D9] text-xs font-semibold hover:bg-purple-200 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Memory</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.chatMemories.chats.map((chat, idx) => (
                  <div
                    key={chat.id}
                    className="p-4 rounded-2xl border border-[#E6D6FA] bg-[#FAF7FF] flex flex-col sm:flex-row gap-4 items-start relative group"
                  >
                    {/* Image Preview & Upload Control */}
                    <div className="w-full sm:w-44 shrink-0 flex flex-col items-center gap-2">
                      <div className="w-full h-36 rounded-xl border border-[#E6D6FA] bg-white overflow-hidden flex items-center justify-center relative">
                        {chat.src ? (
                          <img
                            src={chat.src}
                            alt={chat.alt || 'Memory preview'}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-3 text-xs text-[#4B315F]/50">
                            <Upload className="w-6 h-6 mx-auto mb-1 text-[#A78BFA]" />
                            <span>No photo yet</span>
                          </div>
                        )}

                        {uploadingChatId === chat.id && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs gap-1.5">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                          </div>
                        )}
                      </div>

                      {/* Direct Upload button to Supabase Storage */}
                      <label className="w-full py-1.5 px-3 rounded-xl bg-white border border-[#E6D6FA] hover:bg-purple-50 text-[#6D28D9] text-xs font-semibold text-center cursor-pointer shadow-2xs transition flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(chat.id, file);
                          }}
                        />
                      </label>
                    </div>

                    {/* Details input */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-[#6D28D9]">
                          Memory #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                chatMemories: {
                                  ...formData.chatMemories,
                                  chats: moveItem(formData.chatMemories.chats, idx, 'up'),
                                },
                              })
                            }
                            disabled={idx === 0}
                            className="p-1 rounded-md text-[#4B315F]/60 hover:text-[#6D28D9] disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                chatMemories: {
                                  ...formData.chatMemories,
                                  chats: moveItem(formData.chatMemories.chats, idx, 'down'),
                                },
                              })
                            }
                            disabled={idx === formData.chatMemories.chats.length - 1}
                            className="p-1 rounded-md text-[#4B315F]/60 hover:text-[#6D28D9] disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChat(chat)}
                            className="p-1.5 rounded-md text-[#4B315F]/50 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Memory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#4B315F] mb-1">
                          Caption
                        </label>
                        <input
                          type="text"
                          value={chat.caption}
                          onChange={(e) => {
                            const newChats = [...formData.chatMemories.chats];
                            newChats[idx].caption = e.target.value;
                            setFormData({
                              ...formData,
                              chatMemories: { ...formData.chatMemories, chats: newChats },
                            });
                          }}
                          placeholder="e.g. A moment I still smile about."
                          className="w-full px-3 py-1.5 rounded-xl border border-[#E6D6FA] bg-white text-xs text-[#4B315F] focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#4B315F] mb-1">
                            Date / Tag
                          </label>
                          <input
                            type="text"
                            value={chat.date || ''}
                            onChange={(e) => {
                              const newChats = [...formData.chatMemories.chats];
                              newChats[idx].date = e.target.value;
                              setFormData({
                                ...formData,
                                chatMemories: { ...formData.chatMemories, chats: newChats },
                              });
                            }}
                            placeholder="e.g. Special Night"
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E6D6FA] bg-white text-xs text-[#4B315F] focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#4B315F] mb-1">
                            Photo URL (or uploaded path)
                          </label>
                          <input
                            type="text"
                            value={chat.src}
                            onChange={(e) => {
                              const newChats = [...formData.chatMemories.chats];
                              newChats[idx].src = e.target.value;
                              setFormData({
                                ...formData,
                                chatMemories: { ...formData.chatMemories, chats: newChats },
                              });
                            }}
                            placeholder="/images/... or https://..."
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E6D6FA] bg-white text-xs font-mono text-[#4B315F] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROMISES */}
        {activeTab === 'promises' && (
          <div className="space-y-6 bg-white p-5 sm:p-7 rounded-3xl border border-[#E6D6FA] shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={formData.promises.heading}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promises: { ...formData.promises, heading: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={formData.promises.subtitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promises: { ...formData.promises, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Promise Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-bold text-[#4B315F] uppercase tracking-wider">
                  Promises List ({formData.promises.items.length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newItem: PromiseItem = {
                      id: Date.now(),
                      text: 'I promise to always choose love, kindness, and effort with you.',
                      iconName: 'heart',
                    };
                    setFormData({
                      ...formData,
                      promises: {
                        ...formData.promises,
                        items: [...formData.promises.items, newItem],
                      },
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 text-[#6D28D9] text-xs font-semibold hover:bg-purple-200 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Promise</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.promises.items.map((promise, idx) => (
                  <div
                    key={promise.id}
                    className="p-3.5 rounded-2xl border border-[#E6D6FA] bg-[#FAF7FF] flex items-start gap-3 relative"
                  >
                    {/* Icon Selector Button */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIconPickerIndex(
                            activeIconPickerIndex === idx ? null : idx
                          )
                        }
                        className="w-10 h-10 rounded-xl bg-white border border-[#E6D6FA] flex items-center justify-center hover:border-[#6D28D9] transition cursor-pointer shadow-2xs"
                        title="Click to change icon"
                      >
                        <Heart className="w-5 h-5 text-[#6D28D9]" />
                      </button>

                      {/* Icon Picker Popover */}
                      {activeIconPickerIndex === idx && (
                        <div className="absolute left-0 top-12 z-50 bg-white p-2 rounded-2xl shadow-xl border border-purple-200 grid grid-cols-5 gap-1.5 w-56">
                          {AVAILABLE_ICONS.map((ic) => {
                            const IconComponent = ic.icon;
                            return (
                              <button
                                key={ic.id}
                                type="button"
                                onClick={() => {
                                  const newItems = [...formData.promises.items];
                                  newItems[idx].iconName = ic.id;
                                  setFormData({
                                    ...formData,
                                    promises: {
                                      ...formData.promises,
                                      items: newItems,
                                    },
                                  });
                                  setActiveIconPickerIndex(null);
                                }}
                                className={`p-2 rounded-lg hover:bg-purple-100 flex items-center justify-center cursor-pointer transition ${
                                  promise.iconName === ic.id ? 'bg-purple-100 text-[#6D28D9]' : 'text-gray-600'
                                }`}
                                title={ic.label}
                              >
                                <IconComponent className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Promise text */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono text-[#A78BFA] font-bold">
                          Promise #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                promises: {
                                  ...formData.promises,
                                  items: moveItem(formData.promises.items, idx, 'up'),
                                },
                              })
                            }
                            disabled={idx === 0}
                            className="p-1 rounded-md text-[#4B315F]/60 hover:text-[#6D28D9] disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                promises: {
                                  ...formData.promises,
                                  items: moveItem(formData.promises.items, idx, 'down'),
                                },
                              })
                            }
                            disabled={idx === formData.promises.items.length - 1}
                            className="p-1 rounded-md text-[#4B315F]/60 hover:text-[#6D28D9] disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = formData.promises.items.filter(
                                (_, i) => i !== idx
                              );
                              setFormData({
                                ...formData,
                                promises: { ...formData.promises, items: newItems },
                              });
                            }}
                            className="p-1 rounded-md text-[#4B315F]/50 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={promise.text}
                        onChange={(e) => {
                          const newItems = [...formData.promises.items];
                          newItems[idx].text = e.target.value;
                          setFormData({
                            ...formData,
                            promises: { ...formData.promises, items: newItems },
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E6D6FA] bg-white text-xs sm:text-sm text-[#4B315F] focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing Paragraphs & Signature */}
            <div className="pt-4 border-t border-[#E6D6FA]/70 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#4B315F] uppercase tracking-wider">
                  Closing Message Paragraphs
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      promises: {
                        ...formData.promises,
                        closingParagraphs: [...formData.promises.closingParagraphs, ''],
                      },
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-[#6D28D9] text-xs font-semibold hover:bg-purple-100 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Paragraph</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {formData.promises.closingParagraphs.map((para, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={para}
                      onChange={(e) => {
                        const newClosing = [...formData.promises.closingParagraphs];
                        newClosing[idx] = e.target.value;
                        setFormData({
                          ...formData,
                          promises: {
                            ...formData.promises,
                            closingParagraphs: newClosing,
                          },
                        });
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newClosing = formData.promises.closingParagraphs.filter(
                          (_, i) => i !== idx
                        );
                        setFormData({
                          ...formData,
                          promises: {
                            ...formData.promises,
                            closingParagraphs: newClosing,
                          },
                        });
                      }}
                      className="p-1.5 rounded-lg text-[#4B315F]/50 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#4B315F] mb-1">
                  Signature (Handwriting Font)
                </label>
                <input
                  type="text"
                  value={formData.promises.signature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promises: { ...formData.promises, signature: e.target.value },
                    })
                  }
                  placeholder="e.g. Always with love, 💜"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
