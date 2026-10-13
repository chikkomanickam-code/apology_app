import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { personalization as defaultData, type PersonalizationData } from '../data/personalization';
import { getPublishedScrapbook } from '../lib/scrapbookApi';

interface PersonalizationContextType {
  data: PersonalizationData;
  isLoading: boolean;
  lastPublishedAt: string | null;
  refreshPublished: () => Promise<void>;
  // Preview mode support for Admin
  previewData: PersonalizationData | null;
  setPreviewData: (data: PersonalizationData | null) => void;
}

const PersonalizationContext = createContext<PersonalizationContextType | null>(null);

export const PersonalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [publishedData, setPublishedData] = useState<PersonalizationData>(defaultData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PersonalizationData | null>(null);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, updatedAt, error } = await getPublishedScrapbook();
      if (!error && data) {
        setPublishedData(data);
        setLastPublishedAt(updatedAt);
        // Clear any old legacy local storage key safely now that cloud is established
        try {
          localStorage.removeItem('tasneem_romantic_data_v1');
        } catch {
          // Ignore
        }
      } else {
        // Fallback to default bundled data
        setPublishedData(defaultData);
      }
    } catch (err) {
      console.warn('Could not load published scrapbook, using default:', err);
      setPublishedData(defaultData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // When previewData is set by Admin Preview mode, components consume previewData; otherwise publishedData
  const activeData = previewData || publishedData;

  return (
    <PersonalizationContext.Provider
      value={{
        data: activeData,
        isLoading,
        lastPublishedAt,
        refreshPublished: fetchContent,
        previewData,
        setPreviewData,
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
