import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, ChevronDown } from 'lucide-react';
import { usePersonalization } from '../context/PersonalizationContext';

export const SectionOneApology: React.FC = () => {
  const { data } = usePersonalization();
  const { apology } = data;

  return (
    <section
      id="apology"
      aria-label="My Apology"
      className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 sm:px-6 pt-12 pb-16 max-w-xl mx-auto w-full text-center"
    >
      {/* Ambient background soft lavender orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#E6D6FA]/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-4 w-48 h-48 rounded-full bg-[#F8D9EB]/40 blur-3xl pointer-events-none" />

      {/* Floating background decorative hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[#A78BFA]/30"
            style={{
              top: `${12 + i * 14}%`,
              left: `${8 + ((i * 19) % 80)}%`,
            }}
            animate={{
              y: [-8, 8, -8],
              rotate: [-6, 6, -6],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4.5 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          >
            {i % 2 === 0 ? (
              <Heart className="w-4 h-4 fill-current" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Top pill badge */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 border border-[#E6D6FA] shadow-xs backdrop-blur-xs mb-6 text-xs sm:text-sm font-medium text-[#6D28D9]"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
        <span>{apology.topTag}</span>
      </motion.div>

      {/* Cute Animated Envelope / Heart Illustration */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 flex items-center justify-center"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#E6D6FA] via-[#F8D9EB] to-[#FFFFFF] border-2 border-[#E6D6FA] flex items-center justify-center shadow-md shadow-purple-900/5 animate-gentle-float">
          <Heart className="w-10 h-10 sm:w-12 sm:h-12 fill-[#6D28D9] text-[#6D28D9] animate-heart-pulse" />
        </div>

        {/* Small floating mini hearts */}
        <span className="absolute -top-1 -right-1 text-[#A78BFA] animate-bounce">
          <Heart className="w-4 h-4 fill-current" />
        </span>
        <span className="absolute -bottom-1 -left-1 text-[#F8D9EB] animate-pulse">
          <Sparkles className="w-4 h-4 text-[#A78BFA]" />
        </span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#4B315F] tracking-tight mb-2"
      >
        {apology.heading}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="text-xs sm:text-sm text-[#4B315F]/70 font-light mb-8"
      >
        {apology.subtitle}
      </motion.p>

      {/* Letter Card */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45 }}
        className="w-full bg-white rounded-3xl p-6 sm:p-9 shadow-lg shadow-purple-900/5 border border-[#E6D6FA] text-left paper-texture relative overflow-hidden"
      >
        {/* Cute Washi Tape at top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 washi-tape rounded-xs shadow-xs rotate-[-1deg] pointer-events-none" />

        {/* Letter paragraphs */}
        <div className="space-y-4 text-[#4B315F] text-sm sm:text-base leading-relaxed font-sans">
          {apology.letterParagraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? 'font-serif font-bold text-lg sm:text-xl text-[#6D28D9]'
                  : index === apology.letterParagraphs.length - 1
                  ? 'font-serif font-semibold text-[#6D28D9] pt-2'
                  : 'text-[#4B315F]/90'
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Delicate decorative divider */}
        <div className="mt-8 pt-5 border-t border-[#E6D6FA]/80 flex items-center justify-between text-xs text-[#4B315F]/60">
          <span className="flex items-center gap-1.5 font-handwriting text-base text-[#6D28D9]">
            <Heart className="w-3.5 h-3.5 fill-[#6D28D9]" /> With all my honesty
          </span>
          <span className="text-[11px] font-sans">A Little Place for Us</span>
        </div>
      </motion.div>

      {/* Handwritten note below letter */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="font-handwriting text-xl sm:text-2xl text-[#6D28D9] mt-6 font-medium"
      >
        {apology.handwrittenNote}
      </motion.p>

      {/* Subtle Scroll Cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="mt-10 flex flex-col items-center gap-1 text-[#6D28D9]/70 text-xs sm:text-sm font-medium"
      >
        <span>{apology.scrollCue}</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-4 h-4 text-[#6D28D9]" />
        </motion.div>
      </motion.div>
    </section>
  );
};
