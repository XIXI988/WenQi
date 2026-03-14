import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

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
    setSearchQuery
  } = useApp();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

    // Filter by search
    if (searchQuery && !page.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      // If none of children match either, hide
      const anyChildMatches = children.some(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!anyChildMatches) return null;
    }

    return (
      <div key={id} className="flex flex-col">
        <div 
          className={cn(
            "group flex items-center py-1 px-2 notion-hover cursor-pointer rounded-sm text-sm",
            isActive && "bg-[#efefef] font-medium"
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
          <span className="truncate flex-1">{page.title || '无标题'}</span>
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
          x: isOpen ? 0 : -240,
          width: isOpen ? 240 : 0
        }}
        className={cn(
          "fixed md:relative z-50 h-full bg-[#fbfbfa] border-r border-[#e9e9e7] flex flex-col overflow-hidden",
          !isOpen && "md:hidden"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between group">
          <div className="flex items-center space-x-2 font-semibold text-sm">
            <div className="w-6 h-6 bg-[#37352f] rounded flex items-center justify-center text-white text-xs">文</div>
            <span>文栖</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 notion-hover rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="收起侧边栏"
          >
            <ChevronRight className="rotate-180" size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="搜索页面..."
              className="w-full bg-[#efefef] rounded-md py-1.5 pl-8 pr-2 text-sm notion-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

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
        <div className="p-2 border-t border-[#e9e9e7] space-y-1">
          <button 
            onClick={handleExport}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm notion-hover rounded-md text-gray-600"
            title="导出所有页面为 JSON 备份"
          >
            <Download size={16} />
            <span>导出 JSON 备份</span>
          </button>
          <label className="w-full flex items-center space-x-2 px-3 py-2 text-sm notion-hover rounded-md text-gray-600 cursor-pointer" title="导入 JSON 备份文件">
            <Upload size={16} />
            <span>导入 JSON 备份</span>
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
        </div>
      </motion.aside>
    </>
  );
};
