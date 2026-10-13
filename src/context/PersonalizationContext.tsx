import React, { createContext, useContext, useState } from 'react';
import { personalization as defaultData, type PersonalizationData } from '../data/personalization';

interface PersonalizationContextType {
  data: PersonalizationData;
  updateData: (newData: PersonalizationData) => void;
  resetData: () => void;
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'tasneem_romantic_data_v1';

const PersonalizationContext = createContext<PersonalizationContextType | null>(null);

export const PersonalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PersonalizationData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultData,
          ...parsed,
          apology: { ...defaultData.apology, ...(parsed.apology || {}) },
          chatMemories: { ...defaultData.chatMemories, ...(parsed.chatMemories || {}) },
          promises: { ...defaultData.promises, ...(parsed.promises || {}) },
        };
      }
    } catch {
      // LocalStorage access restricted or invalid JSON
    }
    return defaultData;
  });

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const updateData = (newData: PersonalizationData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.warn('Could not save to localStorage (storage might be full):', e);
    }
  };

  const resetData = () => {
    setData(defaultData);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <PersonalizationContext.Provider
      value={{
        data,
        updateData,
        resetData,
        isEditorOpen,
        setIsEditorOpen,
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
};

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
};
