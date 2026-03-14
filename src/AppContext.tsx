import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Page, Block, AppData, BlockType } from './types';
import { generateId } from './utils';

interface AppContextType {
  data: AppData;
  currentPageId: string | null;
  setCurrentPageId: (id: string | null) => void;
  addPage: (parentId: string | null, title?: string) => string;
  updatePage: (id: string, updates: Partial<Page>) => void;
  deletePage: (id: string) => void;
  updateBlock: (pageId: string, blockId: string, updates: Partial<Block>) => void;
  addBlock: (pageId: string, type: BlockType, index?: number) => void;
  deleteBlock: (pageId: string, blockId: string) => void;
  moveBlock: (pageId: string, fromIndex: number, toIndex: number) => void;
  importData: (json: string) => void;
  exportData: () => string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  focusedBlockId: string | null;
  setFocusedBlockId: (id: string | null) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  recentPageIds: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'wenqi_app_data';

const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage access denied', e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
  }
};

const createInitialBlocks = (count: number) => {
  const blocks: Block[] = [
    { id: generateId(), type: 'h1', content: '开始你的记录' },
    { id: generateId(), type: 'text', content: '这是一个简化版的 Notion 克隆。你可以点击这里开始编辑。' },
    { id: generateId(), type: 'todo', content: '尝试输入 / 来添加新区块', properties: { checked: false } },
  ];
  for (let i = 0; i < count - 3; i++) {
    blocks.push({ id: generateId(), type: 'text', content: '' });
  }
  return blocks;
};

const initialPageId = generateId();
const DEFAULT_DATA: AppData = {
  pages: {
    [initialPageId]: {
      id: initialPageId,
      title: '欢迎使用文栖',
      icon: '📝',
      parentId: null,
      blocks: createInitialBlocks(10),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  },
  rootPageIds: [initialPageId],
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => {
    const saved = safeStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deduplicate rootPageIds to fix potential issues from previous mutation bugs
        if (parsed.rootPageIds) {
          parsed.rootPageIds = Array.from(new Set(parsed.rootPageIds));
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved data', e);
        return DEFAULT_DATA;
      }
    }
    return DEFAULT_DATA;
  });
  const [currentPageId, setCurrentPageId] = useState<string | null>(() => {
    const saved = safeStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.rootPageIds?.[0] || null;
      } catch (e) {
        return initialPageId;
      }
    }
    return initialPageId;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = safeStorage.getItem('wenqi_dark_mode');
    return saved === 'true';
  });
  const [recentPageIds, setRecentPageIds] = useState<string[]>(() => {
    const saved = safeStorage.getItem('wenqi_recent_pages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    safeStorage.setItem('wenqi_recent_pages', JSON.stringify(recentPageIds));
  }, [recentPageIds]);

  useEffect(() => {
    safeStorage.setItem('wenqi_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSetCurrentPageId = useCallback((id: string | null) => {
    setCurrentPageId(id);
    if (id) {
      setRecentPageIds(prev => {
        const filtered = prev.filter(pid => pid !== id);
        return [id, ...filtered].slice(0, 10);
      });
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const addPage = useCallback((parentId: string | null, title: string = '无标题') => {
    const newId = generateId();
    const newPage: Page = {
      id: newId,
      title,
      icon: '📄',
      parentId,
      blocks: Array.from({ length: 10 }, () => ({ id: generateId(), type: 'text', content: '' })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setData(prev => {
      const nextPages = {
        ...prev.pages,
        [newId]: newPage
      };

      // If there's a parent, add a 'page' block to it
      if (parentId && prev.pages[parentId]) {
        const parentPage = prev.pages[parentId];
        const newPageBlock: Block = {
          id: generateId(),
          type: 'page',
          content: '',
          properties: { targetPageId: newId }
        };
        nextPages[parentId] = {
          ...parentPage,
          blocks: [...parentPage.blocks, newPageBlock],
          updatedAt: Date.now()
        };
      }

      return {
        ...prev,
        pages: nextPages,
        rootPageIds: parentId ? prev.rootPageIds : [...prev.rootPageIds, newId]
      };
    });
    return newId;
  }, []);

  const updatePage = useCallback((id: string, updates: Partial<Page>) => {
    setData(prev => {
      if (!prev.pages[id]) return prev;
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [id]: { ...prev.pages[id], ...updates, updatedAt: Date.now() }
        }
      };
    });
    setRecentPageIds(prev => {
      const filtered = prev.filter(pid => pid !== id);
      return [id, ...filtered].slice(0, 10);
    });
  }, []);

  const deletePage = useCallback((id: string) => {
    let nextId: string | null = null;
    
    setData(prev => {
      if (!prev.pages[id]) return prev;

      const toDelete = new Set<string>();
      const findChildren = (pageId: string) => {
        toDelete.add(pageId);
        Object.values(prev.pages).forEach((p: any) => {
          if (p.parentId === pageId) findChildren(p.id);
        });
      };
      findChildren(id);

      const newPages = { ...prev.pages };
      toDelete.forEach(pageId => {
        delete newPages[pageId];
      });

      const newRootPageIds = prev.rootPageIds.filter(pid => !toDelete.has(pid));
      
      if (currentPageId && toDelete.has(currentPageId)) {
        nextId = newRootPageIds[0] || null;
      }

      return {
        ...prev,
        pages: newPages,
        rootPageIds: newRootPageIds
      };
    });

    if (nextId !== null) {
      setCurrentPageId(nextId);
    }
  }, [currentPageId]);

  const updateBlock = useCallback((pageId: string, blockId: string, updates: Partial<Block>) => {
    setData(prev => {
      const page = prev.pages[pageId];
      if (!page) return prev;
      const blocks = page.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [pageId]: { ...page, blocks, updatedAt: Date.now() }
        }
      };
    });
    setRecentPageIds(prev => {
      const filtered = prev.filter(pid => pid !== pageId);
      return [pageId, ...filtered].slice(0, 10);
    });
  }, []);

  const addBlock = useCallback((pageId: string, type: BlockType, index?: number) => {
    const newBlockId = generateId();
    const newBlock: Block = { id: newBlockId, type, content: '' };
    if (type === 'table') {
      newBlock.properties = { rows: [['', ''], ['', '']] };
    }
    
    setData(prev => {
      const page = prev.pages[pageId];
      if (!page) return prev;
      const newBlocks = [...page.blocks];
      const insertIndex = index !== undefined ? index + 1 : newBlocks.length;
      newBlocks.splice(insertIndex, 0, newBlock);
      
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [pageId]: { ...page, blocks: newBlocks, updatedAt: Date.now() }
        }
      };
    });

    // Auto-focus the new block
    setFocusedBlockId(newBlockId);
  }, []);

  const deleteBlock = useCallback((pageId: string, blockId: string) => {
    setData(prev => {
      const page = prev.pages[pageId];
      if (!page) return prev;
      
      const blockToDelete = page.blocks.find(b => b.id === blockId);
      const targetPageId = blockToDelete?.type === 'page' ? blockToDelete.properties?.targetPageId : null;

      let newBlocks = page.blocks.filter(b => b.id !== blockId);
      if (newBlocks.length === 0) {
        newBlocks = [{ id: generateId(), type: 'text', content: '' }];
      }

      const nextPages = { ...prev.pages };
      nextPages[pageId] = { ...page, blocks: newBlocks, updatedAt: Date.now() };

      let nextRootPageIds = [...prev.rootPageIds];
      
      if (targetPageId && nextPages[targetPageId]) {
        const toDelete = new Set<string>();
        const findChildren = (pid: string) => {
          toDelete.add(pid);
          Object.values(nextPages).forEach((p: any) => {
            if (p.parentId === pid) findChildren(p.id);
          });
        };
        findChildren(targetPageId);
        
        toDelete.forEach(pid => {
          delete nextPages[pid];
        });
        
        nextRootPageIds = nextRootPageIds.filter(pid => !toDelete.has(pid));
      }

      return {
        ...prev,
        pages: nextPages,
        rootPageIds: nextRootPageIds
      };
    });
  }, []);

  const moveBlock = useCallback((pageId: string, fromIndex: number, toIndex: number) => {
    setData(prev => {
      const page = prev.pages[pageId];
      if (!page) return prev;
      const newBlocks = [...page.blocks];
      const [moved] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, moved);
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [pageId]: { ...page, blocks: newBlocks, updatedAt: Date.now() }
        }
      };
    });
  }, []);

  const importData = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.pages && parsed.rootPageIds) {
        setData(parsed);
        setCurrentPageId(parsed.rootPageIds[0] || null);
      }
    } catch (e) {
      console.error('Import failed', e);
    }
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  return (
    <AppContext.Provider value={{
      data, currentPageId, setCurrentPageId: handleSetCurrentPageId, addPage, updatePage, deletePage,
      updateBlock, addBlock, deleteBlock, moveBlock, importData, exportData,
      searchQuery, setSearchQuery, focusedBlockId, setFocusedBlockId,
      isDarkMode, toggleDarkMode, recentPageIds
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
