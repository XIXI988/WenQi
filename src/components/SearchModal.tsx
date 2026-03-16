import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, FileText, Clock, ChevronRight, Hash } from 'lucide-react';
import { useApp } from '../AppContext';
import { cn } from '../utils';
import { Page, Block } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  pageId: string;
  blockId?: string;
  type: 'title' | 'content';
  text: string;
  score: number;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { data, setCurrentPageId, recentPageIds, isDarkMode } = useApp();
  const [query, setQuery] = useState('');
  const [scopePageId, setScopePageId] = useState<string | null>(null);
  const [onlyTitle, setOnlyTitle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setScopePageId(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    const pagesToSearch = scopePageId 
      ? [data.pages[scopePageId]].filter(Boolean) as Page[]
      : Object.values(data.pages) as Page[];

    pagesToSearch.forEach(page => {
      // Search title
      if (page.title.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          pageId: page.id,
          type: 'title',
          text: page.title,
          score: 100 + (page.title.toLowerCase().startsWith(lowerQuery) ? 50 : 0)
        });
      }

      // Search content if not onlyTitle
      if (!onlyTitle) {
        page.blocks.forEach(block => {
          if (block.content && block.content.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              pageId: page.id,
              blockId: block.id,
              type: 'content',
              text: block.content,
              score: 50
            });
          }
        });
      }
    });

    return searchResults.sort((a, b) => b.score - a.score);
  }, [query, data, scopePageId, onlyTitle]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/50 rounded-sm px-0.5 text-inherit">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleSelect = (pageId: string) => {
    setCurrentPageId(pageId);
    onClose();
  };

  const recentPages = useMemo(() => {
    return recentPageIds
      .map(id => data.pages[id])
      .filter(Boolean) as Page[];
  }, [recentPageIds, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        className={cn(
          "relative w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]",
          isDarkMode ? "bg-[#202020] text-gray-200 border border-gray-800" : "bg-white text-[#37352f]"
        )}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-3">
          <Search size={20} className="text-gray-400" />
          <div className="flex-1 flex items-center space-x-2">
            {scopePageId && (
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-500">
                <span className="mr-1">{data.pages[scopePageId]?.icon}</span>
                <span className="max-w-[100px] truncate">{data.pages[scopePageId]?.title}</span>
                <button onClick={() => setScopePageId(null)} className="ml-1 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            )}
            <input 
              ref={inputRef}
              type="text" 
              placeholder={scopePageId ? `在 "${data.pages[scopePageId]?.title}" 中搜索...` : "搜索标题或内容..."}
              className="flex-1 bg-transparent border-none focus:outline-none text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setOnlyTitle(!onlyTitle)}
              className={cn(
                "text-xs px-2 py-1 rounded transition-colors",
                onlyTitle 
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              仅标题
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search Body */}
        <div className="flex-1 overflow-y-auto p-2 notion-scrollbar">
          {!query.trim() ? (
            <div className="space-y-4">
              {/* Recent Pages */}
              {recentPages.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                    <Clock size={12} className="mr-1.5" />
                    最近打开
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {recentPages.map(page => (
                      <button
                        key={page.id}
                        className="w-full flex items-center px-3 py-2 notion-hover rounded-lg text-left group"
                        onClick={() => handleSelect(page.id)}
                      >
                        <span className="mr-3 text-lg">{page.icon}</span>
                        <span className="flex-1 truncate">{page.title}</span>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Pages (for scoping) */}
              <div>
                <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                  <FileText size={12} className="mr-1.5" />
                  所有页面
                </div>
                <div className="mt-1 space-y-0.5">
                  {Object.values(data.pages).map(page => (
                    <div key={page.id} className="flex items-center group">
                      <button
                        className="flex-1 flex items-center px-3 py-2 notion-hover rounded-lg text-left"
                        onClick={() => handleSelect(page.id)}
                      >
                        <span className="mr-3 text-lg">{page.icon}</span>
                        <span className="truncate">{page.title}</span>
                      </button>
                      <button 
                        onClick={() => setScopePageId(page.id)}
                        className="mr-2 p-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-500 transition-all"
                        title="在此页面内搜索"
                      >
                        在此搜索
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.length > 0 ? (
                results.map((result, i) => (
                  <button
                    key={`${result.pageId}-${result.blockId || i}`}
                    className="w-full flex items-start px-3 py-2.5 notion-hover rounded-lg text-left group"
                    onClick={() => handleSelect(result.pageId)}
                  >
                    <div className="mt-0.5 mr-3 flex-shrink-0">
                      {result.type === 'title' ? (
                        <span className="text-lg">{data.pages[result.pageId]?.icon}</span>
                      ) : (
                        <Hash size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center text-xs text-gray-400 mb-0.5">
                        <span className="truncate">{data.pages[result.pageId]?.title}</span>
                        {result.type === 'content' && <span className="mx-1">/</span>}
                        {result.type === 'content' && <span>正文内容</span>}
                      </div>
                      <div className={cn(
                        "truncate",
                        result.type === 'title' ? "font-medium" : "text-sm opacity-80"
                      )}>
                        {highlightText(result.text, query)}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <Search size={40} className="mx-auto mb-3 opacity-20" />
                  <p>没有找到匹配的结果</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><kbd className="bg-gray-200 dark:bg-gray-800 px-1 rounded mr-1">Enter</kbd> 选择</span>
            <span className="flex items-center"><kbd className="bg-gray-200 dark:bg-gray-800 px-1 rounded mr-1">Esc</kbd> 关闭</span>
          </div>
          <span>文栖搜索</span>
        </div>
      </motion.div>
    </div>
  );
};
