import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Heart,
  MessageSquare,
  Shield,
  Download,
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
  ChevronDown,
} from 'lucide-react';
import { usePersonalization } from '../context/PersonalizationContext';
import type { PersonalizationData, ChatMemory, PromiseItem } from '../data/personalization';

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

export const LiveEditorModal: React.FC = () => {
  const { data, updateData, resetData, isEditorOpen, setIsEditorOpen } = usePersonalization();

  // Local copy while editing
  const [formData, setFormData] = useState<PersonalizationData>(data);
  const [activeTab, setActiveTab] = useState<'apology' | 'chats' | 'promises'>('apology');
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [activeIconPickerIndex, setActiveIconPickerIndex] = useState<number | null>(null);

  // Sync formData when editor opens
  React.useEffect(() => {
    if (isEditorOpen) {
      setFormData(data);
    }
  }, [isEditorOpen, data]);

  if (!isEditorOpen) return null;

  // Image resizing utility to keep localStorage efficient (max 850px width/height, jpeg quality 0.82)
  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 850;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

          setFormData((prev) => {
            const updatedChats = [...prev.chatMemories.chats];
            updatedChats[index] = {
              ...updatedChats[index],
              src: dataUrl,
            };
            return {
              ...prev,
              chatMemories: {
                ...prev.chatMemories,
                chats: updatedChats,
              },
            };
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat: ChatMemory = {
      id: newId,
      src: `/images/chats/${newId}.jpg`,
      caption: 'A special moment I cherish with you.',
      date: 'Sweet Memory',
      alt: 'Chat screenshot',
    };
    setFormData((prev) => ({
      ...prev,
      chatMemories: {
        ...prev.chatMemories,
        chats: [...prev.chatMemories.chats, newChat],
      },
    }));
  };

  const handleRemoveChat = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      chatMemories: {
        ...prev.chatMemories,
        chats: prev.chatMemories.chats.filter((_, i) => i !== index),
      },
    }));
  };

  const handleAddPromise = () => {
    const newPromise: PromiseItem = {
      id: Date.now(),
      text: 'I promise to always value and protect what we have.',
      iconName: 'heart',
    };
    setFormData((prev) => ({
      ...prev,
      promises: {
        ...prev.promises,
        items: [...prev.promises.items, newPromise],
      },
    }));
  };

  const handleRemovePromise = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      promises: {
        ...prev.promises,
        items: prev.promises.items.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSelectPromiseIcon = (index: number, iconId: string) => {
    const updatedItems = [...formData.promises.items];
    updatedItems[index] = {
      ...updatedItems[index],
      iconName: iconId,
    };
    setFormData((prev) => ({
      ...prev,
      promises: {
        ...prev.promises,
        items: updatedItems,
      },
    }));
    setActiveIconPickerIndex(null);
  };

  const renderIconComponent = (iconName: string) => {
    const matched = AVAILABLE_ICONS.find((item) => item.id === iconName);
    const IconComp = matched ? matched.icon : Heart;
    return <IconComp className="w-4 h-4 text-[#6D28D9]" />;
  };

  const handleSave = () => {
    updateData(formData);
    setSaveSuccessToast(true);
    setTimeout(() => {
      setSaveSuccessToast(false);
      setIsEditorOpen(false);
    }, 700);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'personalization.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleReset = () => {
    if (window.confirm('Reset all text, photos, and promises back to original default settings?')) {
      resetData();
      setIsEditorOpen(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FAF7FF] via-[#F5EEFD] to-[#FAF7FF] border-b border-[#E6D6FA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#E6D6FA] text-[#6D28D9] flex items-center justify-center">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#4B315F]">
                  Personalize Your Love Letter
                </h3>
                <p className="text-[11px] text-[#4B315F]/70">
                  Edit apology text, upload real screenshots, and customize your promises & logos
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditorOpen(false)}
              className="p-1.5 rounded-full hover:bg-purple-100 text-[#4B315F]/70 transition cursor-pointer"
              aria-label="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-[#E6D6FA] bg-white px-3 sm:px-6 pt-2 gap-2 overflow-x-auto text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab('apology')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'apology'
                  ? 'border-[#6D28D9] text-[#6D28D9] font-semibold'
                  : 'border-transparent text-[#4B315F]/70 hover:text-[#4B315F]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>1. My Apology</span>
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'chats'
                  ? 'border-[#6D28D9] text-[#6D28D9] font-semibold'
                  : 'border-transparent text-[#4B315F]/70 hover:text-[#4B315F]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>2. Chat Memories ({formData.chatMemories.chats.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('promises')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'promises'
                  ? 'border-[#6D28D9] text-[#6D28D9] font-semibold'
                  : 'border-transparent text-[#4B315F]/70 hover:text-[#4B315F]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>3. Promises & Logos ({formData.promises.items.length})</span>
            </button>
          </div>

          {/* Tab Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FAF7FF]/40 text-xs sm:text-sm">
            {/* TAB 1: APOLOGY */}
            {activeTab === 'apology' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-[#4B315F] mb-1">
                    Top Pill Tag
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
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-white text-[#4B315F] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#4B315F] mb-1">
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
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-white text-[#4B315F] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#4B315F] mb-1">
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
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-white text-[#4B315F] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#4B315F] mb-1">
                    Apology Letter Text (Separate paragraphs with blank lines)
                  </label>
                  <textarea
                    rows={6}
                    value={formData.apology.letterParagraphs.join('\n\n')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apology: {
                          ...formData.apology,
                          letterParagraphs: e.target.value.split('\n\n').filter((p) => p.trim() !== ''),
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D6FA] bg-white text-[#4B315F] leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                    placeholder="Write your letter here..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4B315F] mb-1">
                    Handwritten Note (Below letter)
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
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-white text-[#4B315F] font-handwriting text-base text-[#6D28D9] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CHAT MEMORIES & PHOTOS */}
            {activeTab === 'chats' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#4B315F]/80">
                    Upload your real screenshots directly from your phone or PC.
                  </p>
                  <button
                    onClick={handleAddChat}
                    className="px-3 py-1.5 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1 hover:bg-[#5b21b6] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Chat</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.chatMemories.chats.map((chat, idx) => (
                    <div
                      key={chat.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#E6D6FA] shadow-xs flex flex-col sm:flex-row gap-3.5 items-start sm:items-center"
                    >
                      {/* Thumbnail Preview */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#FAF7FF] border border-[#E6D6FA] shrink-0 flex items-center justify-center">
                        <img
                          src={chat.src}
                          alt={chat.alt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <label className="absolute inset-0 bg-black/40 hover:bg-black/50 text-white flex flex-col items-center justify-center cursor-pointer transition text-[10px] font-medium p-1 text-center">
                          <Upload className="w-4 h-4 mb-0.5" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(idx, e)}
                          />
                        </label>
                      </div>

                      {/* Text Fields */}
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-[#6D28D9]">
                            Screenshot #{idx + 1}
                          </span>
                          {formData.chatMemories.chats.length > 1 && (
                            <button
                              onClick={() => handleRemoveChat(idx)}
                              className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                              title="Delete this slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Caption (e.g. A memory I keep close)"
                            value={chat.caption}
                            onChange={(e) => {
                              const newChats = [...formData.chatMemories.chats];
                              newChats[idx].caption = e.target.value;
                              setFormData({
                                ...formData,
                                chatMemories: { ...formData.chatMemories, chats: newChats },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#E6D6FA] text-xs text-[#4B315F] focus:outline-none focus:ring-1 focus:ring-[#A78BFA]"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Date / Label (e.g. Favorite Conversation)"
                            value={chat.date || ''}
                            onChange={(e) => {
                              const newChats = [...formData.chatMemories.chats];
                              newChats[idx].date = e.target.value;
                              setFormData({
                                ...formData,
                                chatMemories: { ...formData.chatMemories, chats: newChats },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#E6D6FA] text-xs text-[#4B315F] focus:outline-none focus:ring-1 focus:ring-[#A78BFA]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MY PROMISES & LOGOS */}
            {activeTab === 'promises' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-[#4B315F] mb-1">
                    Promises Heading
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
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-white text-[#4B315F] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-[#4B315F]">
                      Your Promises & Logos
                    </label>
                    <button
                      onClick={handleAddPromise}
                      className="px-3 py-1 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1 hover:bg-[#5b21b6] transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Promise</span>
                    </button>
                  </div>

                  {formData.promises.items.map((item, i) => (
                    <div key={item.id} className="p-3 bg-white rounded-2xl border border-[#E6D6FA] shadow-2xs space-y-2">
                      <div className="flex items-center gap-2">
                        {/* Interactive Logo Selector Button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveIconPickerIndex(activeIconPickerIndex === i ? null : i)
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF7FF] border border-[#E6D6FA] hover:border-[#6D28D9] transition cursor-pointer shadow-2xs"
                            title="Click to choose a cute logo/icon for this promise"
                          >
                            {renderIconComponent(item.iconName)}
                            <ChevronDown className="w-3 h-3 text-[#6D28D9]" />
                          </button>

                          {/* Icon Palette Dropdown */}
                          {activeIconPickerIndex === i && (
                            <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-[#E6D6FA] rounded-2xl p-2.5 shadow-xl grid grid-cols-5 gap-1.5 w-60">
                              {AVAILABLE_ICONS.map((iconOption) => {
                                const IconComp = iconOption.icon;
                                const isSelected = item.iconName === iconOption.id;
                                return (
                                  <button
                                    key={iconOption.id}
                                    type="button"
                                    onClick={() => handleSelectPromiseIcon(i, iconOption.id)}
                                    className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#E6D6FA] text-[#6D28D9] font-bold ring-1 ring-[#6D28D9]'
                                        : 'hover:bg-purple-50 text-[#4B315F]'
                                    }`}
                                    title={iconOption.label}
                                  >
                                    <IconComp className="w-4 h-4" />
                                    <span className="text-[9px] truncate max-w-full">
                                      {iconOption.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Promise text input */}
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const newItems = [...formData.promises.items];
                            newItems[i].text = e.target.value;
                            setFormData({
                              ...formData,
                              promises: { ...formData.promises, items: newItems },
                            });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-[#E6D6FA] bg-white text-xs text-[#4B315F] focus:outline-none focus:ring-1 focus:ring-[#A78BFA]"
                          placeholder="Write your promise here..."
                        />

                        {/* Delete promise option */}
                        {formData.promises.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePromise(i)}
                            className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Delete this promise"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block font-semibold text-[#4B315F] mb-1">
                    Closing Love Message (Separate paragraphs with blank lines)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.promises.closingParagraphs.join('\n\n')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        promises: {
                          ...formData.promises,
                          closingParagraphs: e.target.value.split('\n\n').filter((p) => p.trim() !== ''),
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D6FA] bg-white text-[#4B315F] leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4B315F] mb-1">
                    Signature
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
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D6FA] bg-white font-handwriting text-xl text-[#6D28D9] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-[#E6D6FA] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-2 rounded-xl text-xs text-[#4B315F]/70 hover:text-red-500 hover:bg-red-50 transition cursor-pointer flex items-center gap-1"
                title="Reset to original defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl text-xs text-[#6D28D9] hover:bg-purple-50 transition cursor-pointer flex items-center gap-1"
                title="Download backup file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup JSON</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#4B315F] hover:bg-purple-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/25 hover:shadow-purple-700/35 active:scale-97 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{saveSuccessToast ? 'Saved! 💜' : 'Save & View Letter'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
