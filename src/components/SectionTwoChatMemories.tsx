import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, X, Info } from 'lucide-react';
import { type ChatMemory } from '../data/personalization';
import { usePersonalization } from '../context/PersonalizationContext';

export const SectionTwoChatMemories: React.FC = () => {
  const { data } = usePersonalization();
  const { chatMemories } = data;
  const [lightboxChat, setLightboxChat] = useState<ChatMemory | null>(null);

  return (
    <section
      id="chat-memories"
      aria-label="Our Chat Memories"
      className="relative py-16 px-4 sm:px-6 max-w-lg mx-auto w-full text-center"
    >
      {/* Decorative Section Separator */}
      <div className="flex items-center justify-center gap-3 mb-10 text-[#A78BFA]/50">
        <span className="w-12 h-px bg-[#E6D6FA]" />
        <Heart className="w-4 h-4 fill-[#A78BFA] text-[#A78BFA]" />
        <span className="w-12 h-px bg-[#E6D6FA]" />
      </div>

      {/* Heading & Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.7 }}
        className="mb-10"
      >
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E6D6FA]/70 text-[#6D28D9] text-xs font-semibold uppercase tracking-wider mb-2">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Our Little Messages</span>
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4B315F] tracking-tight">
          {chatMemories.heading}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#4B315F]/70 font-light">
          {chatMemories.subtitle}
        </p>
      </motion.div>

      {/* Vertical Scrapbook Cards List */}
      <div className="space-y-10 sm:space-y-12">
        {chatMemories.chats.map((chat, index) => {
          // Subtle alternating rotation (-1deg, 1deg, 0deg) for scrapbook feeling
          const rotationClasses = ['rotate-[-1deg]', 'rotate-[1deg]', 'rotate-0', 'rotate-[-1.5deg]', 'rotate-[1.5deg]'];
          const rotationClass = rotationClasses[index % rotationClasses.length];

          return (
            <React.Fragment key={chat.id}>
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`group relative bg-white p-3 sm:p-4 rounded-3xl scrapbook-card text-left transition-transform duration-300 hover:rotate-0 hover:scale-[1.01] ${rotationClass}`}
              >
                {/* Cute Washi Tape at corner */}
                <div
                  className={`absolute -top-2.5 ${
                    index % 2 === 0 ? 'left-6 rotate-[-2deg]' : 'right-6 rotate-[2deg]'
                  } w-20 h-5 washi-tape rounded-xs shadow-xs pointer-events-none z-10`}
                />

                {/* Chat Screenshot Frame (original aspect ratio preserved, never cropped) */}
                <div
                  onClick={() => setLightboxChat(chat)}
                  className="relative rounded-2xl overflow-hidden bg-[#FAF7FF] border border-[#E6D6FA]/70 cursor-pointer flex items-center justify-center transition"
                  title="Tap to enlarge screenshot"
                >
                  <ChatImageDisplay chat={chat} />
                </div>

                {/* Caption & Details Footer */}
                <div className="pt-3 px-1 flex items-center justify-between gap-2">
                  <p className="font-serif text-xs sm:text-sm font-medium text-[#4B315F] italic">
                    “{chat.caption}”
                  </p>
                  <span className="shrink-0 text-[10px] font-sans text-[#6D28D9] bg-[#E6D6FA]/60 px-2.5 py-0.5 rounded-full">
                    {chat.date || 'Memory'}
                  </span>
                </div>
              </motion.div>

              {/* Tiny heart divider between items */}
              {index < chatMemories.chats.length - 1 && (
                <div className="flex justify-center text-[#E6D6FA]">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxChat(null)}
          >
            <div
              className="relative max-w-sm sm:max-w-md w-full bg-white rounded-3xl p-4 sm:p-6 shadow-2xl text-left border border-purple-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setLightboxChat(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-purple-50 text-[#4B315F] hover:bg-purple-100 transition cursor-pointer z-10"
                aria-label="Close enlarged screenshot"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Lightbox Image (Unconstrained original aspect ratio) */}
              <div className="rounded-2xl overflow-hidden bg-[#FAF7FF] border border-[#E6D6FA] max-h-[75vh] flex items-center justify-center overflow-y-auto mb-3">
                <ChatImageDisplay chat={lightboxChat} isLightbox={true} />
              </div>

              {/* Caption */}
              <p className="font-serif text-sm sm:text-base font-semibold text-[#4B315F] italic text-center">
                “{lightboxChat.caption}”
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

// Image renderer with graceful placeholder when screenshot has not been added yet
const ChatImageDisplay: React.FC<{ chat: ChatMemory; isLightbox?: boolean }> = ({ chat, isLightbox = false }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`w-full ${isLightbox ? 'py-12 px-6' : 'py-10 px-4'} flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#FAF7FF] to-[#F5EEFD] text-[#4B315F]`}>
        <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#6D28D9] mb-3 border border-[#E6D6FA]">
          <MessageSquare className="w-6 h-6" />
        </div>
        <p className="font-serif font-semibold text-sm text-[#4B315F] mb-1">
          Chat Screenshot Placeholder
        </p>
        <p className="text-xs text-[#4B315F]/70 max-w-xs mb-3 font-light">
          Place your real screenshot at:
        </p>
        <code className="text-[11px] bg-white border border-[#E6D6FA] px-2.5 py-1 rounded-full text-[#6D28D9] font-mono">
          public{chat.src}
        </code>
        <p className="text-[10px] text-[#A78BFA] mt-2 flex items-center gap-1 italic">
          <Info className="w-3 h-3" /> Original proportions will be automatically preserved.
        </p>
      </div>
    );
  }

  return (
    <img
      src={chat.src}
      alt={chat.alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`w-full h-auto object-contain block ${isLightbox ? 'max-h-[70vh]' : 'max-h-[460px]'}`}
    />
  );
};
