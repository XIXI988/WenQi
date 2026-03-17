import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Page } from '../types';
import { 
  Search, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Download, 
  Upload, 
  Trash2,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { SearchModal } from './SearchModal';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { 
    data, 
    currentPageId, 
    setCurrentPageId, 
    addPage, 
    deletePage, 
    exportData, 
    importData,
    searchQuery,
    setSearchQuery,
    isDarkMode,
    toggleDarkMode
  } = useApp();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);

  // Load width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('wenqi_sidebar_width');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
    localStorage.setItem('wenqi_sidebar_width', sidebarWidth.toString());
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= 160 && newWidth <= 480) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, sidebarWidth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search on '/' if not in an input/editable
      if (e.key === '/' && !isSearchOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      importData(content);
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wenqi_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const renderPageItem = (id: string, depth: number = 0) => {
    const page = data.pages[id];
    if (!page) return null;

    const children = (Object.values(data.pages) as Page[]).filter(p => p.parentId === id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded[id];
    const isActive = currentPageId === id;

    return (
      <div key={id} className="flex flex-col">
        <div 
          className={cn(
            "group flex items-center py-1 px-2 notion-hover cursor-pointer rounded-sm text-sm",
            isActive && (isDarkMode ? "bg-[#2c2c2c] font-medium" : "bg-[#efefef] font-medium")
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setCurrentPageId(id)}
        >
          <div 
            className="w-5 h-5 flex items-center justify-center notion-hover rounded-sm mr-1"
            onClick={(e) => hasChildren && toggleExpand(id, e)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <div className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="mr-2">{page.icon}</span>
          <span className="truncate flex-1">{page.title}</span>
          <div className="hidden group-hover:flex items-center space-x-1">
            <button 
              className="p-1 notion-hover rounded-sm"
              onClick={(e) => { 
                e.stopPropagation(); 
                const newId = addPage(id); 
                setCurrentPageId(newId);
                setExpanded(prev => ({ ...prev, [id]: true }));
              }}
              title="添加子页面"
            >
              <Plus size={14} />
            </button>
            <button 
              className="p-1 notion-hover rounded-sm text-red-500"
              onClick={(e) => { 
                e.stopPropagation(); 
                // Using a simple state-based confirmation or just deleting for now
                // since window.confirm doesn't work well in iframes
                deletePage(id); 
              }}
              title="删除页面"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {isExpanded && children.map(child => renderPageItem(child.id, depth + 1))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -sidebarWidth,
          width: isOpen ? sidebarWidth : 0
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 30,
          width: { duration: isResizing ? 0 : 0.2 },
          x: { duration: 0.2 }
        }}
        className={cn(
          "fixed md:relative z-50 h-full border-r flex flex-col overflow-hidden transition-colors duration-200",
          isDarkMode ? "bg-[#191919] border-gray-800" : "bg-[#fbfbfa] border-[#e9e9e7]",
          !isOpen && "md:hidden"
        )}
      >
        {/* Resize Handle */}
        {isOpen && (
          <div 
            onMouseDown={startResizing}
            className={cn(
              "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors group/resizer",
              isResizing ? (isDarkMode ? "bg-blue-500" : "bg-blue-400") : "hover:bg-gray-300 dark:hover:bg-gray-700"
            )}
          >
            <div className={cn(
              "absolute right-0 top-0 bottom-0 w-[2px] opacity-0 group-hover/resizer:opacity-100 transition-opacity",
              isDarkMode ? "bg-gray-700" : "bg-gray-300"
            )} />
          </div>
        )}
        
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between group">
          <div className="flex items-center space-x-2 font-semibold text-sm">
            <div className={cn(
              "w-6 h-6 rounded flex items-center justify-center text-white text-xs",
              isDarkMode ? "bg-gray-700" : "bg-[#37352f]"
            )}>文</div>
            <span>文栖</span>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={toggleDarkMode}
              className="p-1 notion-hover rounded-sm transition-opacity"
              title={isDarkMode ? "切换到白天模式" : "切换到黑夜模式"}
            >
              {isDarkMode ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} />}
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 notion-hover rounded-sm transition-opacity"
              title="收起侧边栏"
            >
              <ChevronRight className="rotate-180" size={16} />
            </button>
          </div>
        </div>

        {/* Search Trigger */}
        <div className="px-3 mb-4">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className={cn(
              "w-full flex items-center space-x-2 rounded-md py-1.5 px-3 text-sm transition-colors text-left",
              isDarkMode ? "bg-[#2c2c2c] text-gray-400 hover:bg-[#353535]" : "bg-[#efefef] text-gray-500 hover:bg-[#e5e5e5]"
            )}
          >
            <Search size={14} className="flex-shrink-0" />
            <span className="flex-1 truncate">搜索标题或内容...</span>
            <span className="text-[10px] opacity-50 border border-current px-1 rounded">/</span>
          </button>
        </div>

        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        {/* Page List */}
        <div className="flex-1 overflow-y-auto px-1 py-2">
          <div className="flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span>页面</span>
            <button 
              onClick={() => {
                const newId = addPage(null);
                setCurrentPageId(newId);
              }}
              className="p-1 notion-hover rounded-sm"
              title="添加根页面"
            >
              <Plus size={14} />
            </button>
          </div>
          {data.rootPageIds.map(id => renderPageItem(id))}
        </div>

        {/* Sidebar Footer */}
        <div className={cn(
          "p-2 border-t flex items-center justify-center transition-colors",
          isDarkMode ? "border-gray-800" : "border-[#e9e9e7]"
        )}>
          <span className="text-[10px] opacity-30">文栖 v1.0.0</span>
        </div>
      </motion.aside>
    </>
  );
};
