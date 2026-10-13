export interface ChatMemory {
  id: string;
  src: string;
  caption: string;
  date?: string;
  alt: string;
}

export interface PromiseItem {
  id: number | string;
  text: string;
  iconName: string;
}

export interface PersonalizationData {
  recipientName?: string;
  
  // SECTION 1: APOLOGY 💌
  apology: {
    topTag: string;
    heading: string;
    subtitle: string;
    letterParagraphs: string[];
    handwrittenNote: string;
    scrollCue: string;
  };

  // SECTION 2: OUR CHAT MEMORIES 🫶
  chatMemories: {
    heading: string;
    subtitle: string;
    chats: ChatMemory[];
  };

  // SECTION 3: MY PROMISES TO YOU ♾️
  promises: {
    heading: string;
    subtitle: string;
    items: PromiseItem[];
    closingParagraphs: string[];
    signature: string;
  };
}

export const personalization: PersonalizationData = {
  recipientName: "My Love",

  // 1. My Apology
  apology: {
    topTag: "A little something from my heart 💜",
    heading: "I'm Sorry, My Love",
    subtitle: "Please read this when you're ready.",
    letterParagraphs: [
      "My love,",
      "I have something important to tell you, from the bottom of my heart.",
      "I'm truly sorry for the times I hurt you. You mean so much to me, and I never want to treat your feelings as something small.",
      "I know that saying sorry cannot instantly fix everything. I want to understand you better, listen to you, and show through my actions that your happiness and trust matter to me.",
      "You are so special to me. I don't want to give up on us. I want to learn, grow, and become a better partner.",
      "I'm sorry, my love. 💜"
    ],
    handwrittenNote: "Made with all my heart, just for you.",
    scrollCue: "Scroll a little, there's more for you ↓",
  },

  // 2. Our Chat Memories
  chatMemories: {
    heading: "Little Pieces of Us",
    subtitle: "Every message holds a little memory.",
    chats: [
      {
        id: "chat-01",
        src: "/images/chats/chat-01.jpg",
        caption: "A little moment I still smile about.",
        date: "Special Memory",
        alt: "Chat screenshot 1",
      },
      {
        id: "chat-02",
        src: "/images/chats/chat-02.jpg",
        caption: "One of my favourite conversations.",
        date: "Sweet Exchange",
        alt: "Chat screenshot 2",
      },
      {
        id: "chat-03",
        src: "/images/chats/chat-03.jpg",
        caption: "A memory I want to keep close.",
        date: "Comfort & Warmth",
        alt: "Chat screenshot 3",
      },
      {
        id: "chat-04",
        src: "/images/chats/chat-04.jpg",
        caption: "Little things that mean a lot to me.",
        date: "Cherished Words",
        alt: "Chat screenshot 4",
      },
      {
        id: "chat-05",
        src: "/images/chats/chat-05.jpg",
        caption: "When talking to you made everything better.",
        date: "A Gentle Moment",
        alt: "Chat screenshot 5",
      },
    ],
  },

  // 3. My Promises to You
  promises: {
    heading: "My Promises to You 💜",
    subtitle: "Not just words. Little things I want to keep working on.",
    items: [
      {
        id: 1,
        text: "I promise to listen to your feelings and never dismiss what matters to you.",
        iconName: "ear",
      },
      {
        id: 2,
        text: "I promise to communicate honestly, even when a conversation is difficult.",
        iconName: "message",
      },
      {
        id: 3,
        text: "I promise to respect you, your boundaries, and your need for time and space.",
        iconName: "shield",
      },
      {
        id: 4,
        text: "I promise to keep learning from my mistakes instead of repeating them without trying to change.",
        iconName: "sparkles",
      },
      {
        id: 5,
        text: "I promise to show you love through my actions, my patience, and the little things I do.",
        iconName: "heart",
      },
      {
        id: 6,
        text: "I promise to keep choosing kindness, understanding, and effort as we grow together.",
        iconName: "smile",
      },
    ],
    closingParagraphs: [
      "I don't want to lose you, my love.",
      "I want to keep making memories with you, sharing little moments, laughing together, and learning how to love each other better.",
      "I can't promise to be perfect, but I want to keep trying to be better for myself and for us.",
      "You mean so much to me. I hope my actions can slowly show you everything my heart is trying to say."
    ],
    signature: "Always with love, 💜",
  },
};
