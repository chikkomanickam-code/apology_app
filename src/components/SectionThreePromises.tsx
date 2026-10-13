import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Ear, MessageCircle, Shield, Sparkles, Smile, Download, Edit3, Flower2, Star, Coffee, Lock, Sun, Infinity as InfinityIcon, Gift, Compass, Flame } from 'lucide-react';
import { usePersonalization } from '../context/PersonalizationContext';

interface SectionThreePromisesProps {
  onInstall?: () => void;
  canInstall?: boolean;
}

export const SectionThreePromises: React.FC<SectionThreePromisesProps> = ({ onInstall, canInstall }) => {
  const { data, setIsEditorOpen } = usePersonalization();
  const { promises } = data;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'ear':
        return <Ear className="w-5 h-5 text-[#6D28D9]" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-[#6D28D9]" />;
      case 'shield':
        return <Shield className="w-5 h-5 text-[#6D28D9]" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-[#6D28D9]" />;
      case 'smile':
        return <Smile className="w-5 h-5 text-[#6D28D9]" />;
      case 'flower':
        return <Flower2 className="w-5 h-5 text-[#6D28D9]" />;
      case 'star':
        return <Star className="w-5 h-5 fill-[#6D28D9] text-[#6D28D9]" />;
      case 'coffee':
        return <Coffee className="w-5 h-5 text-[#6D28D9]" />;
      case 'lock':
        return <Lock className="w-5 h-5 text-[#6D28D9]" />;
      case 'sun':
        return <Sun className="w-5 h-5 text-[#6D28D9]" />;
      case 'infinity':
        return <InfinityIcon className="w-5 h-5 text-[#6D28D9]" />;
      case 'gift':
        return <Gift className="w-5 h-5 text-[#6D28D9]" />;
      case 'compass':
        return <Compass className="w-5 h-5 text-[#6D28D9]" />;
      case 'flame':
        return <Flame className="w-5 h-5 text-[#6D28D9]" />;
      case 'heart':
      default:
        return <Heart className="w-5 h-5 fill-[#6D28D9] text-[#6D28D9]" />;
    }
  };

  return (
    <section
      id="promises"
      aria-label="My Promises to You"
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
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>From My Heart</span>
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4B315F] tracking-tight">
          {promises.heading}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#4B315F]/70 font-light">
          {promises.subtitle}
        </p>
      </motion.div>

      {/* Six Vertically Stacked Promise Cards */}
      <div className="space-y-4 mb-16 text-left">
        {promises.items.map((promise, index) => (
          <motion.div
            key={promise.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group bg-white p-4 sm:p-5 rounded-2xl border border-[#E6D6FA] shadow-sm shadow-purple-900/5 hover:border-[#A78BFA] transition-all flex items-start gap-3.5"
          >
            {/* Cute Icon badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FAF7FF] to-[#E6D6FA] border border-[#E6D6FA] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              {renderIcon(promise.iconName)}
            </div>

            {/* Promise text */}
            <div className="flex-1">
              <div className="flex items-center gap-1 text-[11px] font-mono text-[#A78BFA] mb-1">
                <Heart className="w-3 h-3 fill-current text-[#E6D6FA]" />
                <span>Promise {index + 1}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#4B315F] font-medium leading-relaxed font-sans">
                {promise.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Final Emotional Closing Card with Dreamy Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-b from-[#F5EEFD] via-[#FAF7FF] to-[#F8D9EB]/30 rounded-3xl p-7 sm:p-9 border border-[#E6D6FA] shadow-md shadow-purple-900/5 overflow-hidden text-center"
      >
        {/* Animated small floating heart */}
        <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-[#E6D6FA] flex items-center justify-center mx-auto mb-5 text-[#6D28D9]">
          <Heart className="w-6 h-6 fill-[#6D28D9] animate-heart-pulse" />
        </div>

        {/* Closing paragraphs */}
        <div className="space-y-4 text-xs sm:text-sm text-[#4B315F]/90 leading-relaxed font-sans">
          {promises.closingParagraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? 'font-serif font-bold text-base sm:text-lg text-[#6D28D9]'
                  : 'text-[#4B315F]/85'
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Signature */}
        <p className="font-handwriting text-2xl sm:text-3xl text-[#6D28D9] font-bold mt-6 mb-2">
          {promises.signature}
        </p>

        {/* Footer actions: Save PWA and Personalize button */}
        <div className="mt-8 pt-5 border-t border-[#E6D6FA]/80 flex flex-col items-center gap-2.5">
          {canInstall && onInstall && (
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E6D6FA] text-xs font-semibold text-[#6D28D9] hover:bg-purple-50 shadow-xs cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save this little place to your phone</span>
            </button>
          )}

          <button
            onClick={() => setIsEditorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#6D28D9] bg-white/80 hover:bg-white border border-[#E6D6FA] shadow-2xs transition cursor-pointer"
            title="Open live in-browser editor to input your words and photos"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Personalize Words & Photos</span>
          </button>
        </div>
      </motion.div>

      {/* Bottom watermark */}
      <p className="mt-12 text-[11px] text-[#4B315F]/40 font-light">
        A Little Place for Us 💜 • Made from my heart
      </p>
    </section>
  );
};
