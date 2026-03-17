import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { BlockItem } from './BlockItem';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, 
  Image as ImageIcon, 
  MoreHorizontal, 
  Download, 
  Upload,
  FileJson,
  HelpCircle,
  Settings,
  ChevronRight
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { HelpModal } from './HelpModal';
import { cn } from '../utils';
import { serializePageToMarkdown, parseMarkdownToBlocks } from '../services/markdownService';
import { useToast, ToastContainer } from './Toast';

interface EditorProps {
  isSidebarOpen?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ isSidebarOpen = true }) => {
  const { 
    data, 
    currentPageId, 
    updatePage, 
    moveBlock, 
    setCurrentPageId, 
    addBlock, 
    focusedBlockId, 
    setFocusedBlockId, 
    isDarkMode,
    exportData,
    importData
  } = useApp();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [emojiPickerPos, setEmojiPickerPos] = useState({ top: 0, left: 0 });
  const { toasts, showToast } = useToast();

  const page = currentPageId ? data.pages[currentPageId] : null;

  // Auto-focus first block on new page
  React.useEffect(() => {
    if (page && page.blocks.length > 0 && !focusedBlockId) {
      // Only auto-focus if it's a "fresh" page (e.g., all blocks are empty text)
      const isFreshPage = page.blocks.every(b => b.type === 'text' && b.content === '');
      if (isFreshPage) {
        setFocusedBlockId(page.blocks[0].id);
      }
    }
  }, [currentPageId]);

  const handleExport = () => {
    if (!page) return;
    const markdown = serializePageToMarkdown(page, data.pages);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.title || 'untitled'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('导出成功', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !page) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { title, blocks } = parseMarkdownToBlocks(content);
      updatePage(page.id, { title, blocks });
      showToast('导入成功', 'success');
    };
    reader.readAsText(file);
  };

  const handleJsonExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wenqi_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('JSON 备份导出成功', 'success');
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      importData(content);
      showToast('JSON 备份导入成功', 'success');
    };
    reader.readAsText(file);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!page) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center transition-colors duration-200",
        isDarkMode ? "bg-[#191919] text-gray-600" : "bg-white text-gray-400"
      )}>
        选择一个页面开始记录
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = page.blocks.findIndex(b => b.id === active.id);
      const newIndex = page.blocks.findIndex(b => b.id === over.id);
      moveBlock(page.id, oldIndex, newIndex);
    }
  };

  const getBreadcrumbs = () => {
    const crumbs = [];
    let current: any = page;
    while (current) {
      crumbs.unshift(current);
      current = current.parentId ? data.pages[current.parentId] : null;
    }
    return crumbs;
  };

  const handleContentClick = (e: React.MouseEvent) => {
    // If clicking the empty space or the container itself
    if (e.target === e.currentTarget) {
      const lastBlock = page.blocks[page.blocks.length - 1];
      if (!lastBlock || lastBlock.content !== '' || lastBlock.type !== 'text') {
        addBlock(page.id, 'text');
      } else {
        setFocusedBlockId(lastBlock.id);
      }
    }
  };

  return (
    <div className={cn("flex-1 flex flex-col h-full transition-colors duration-200", isDarkMode ? "bg-[#191919]" : "bg-white")} onClick={handleContentClick}>
      {/* Top Nav / Breadcrumbs */}
      <div className={cn(
        "sticky top-0 z-30 backdrop-blur-md py-3 flex items-center justify-between border-b border-transparent transition-all duration-200",
        isDarkMode ? "bg-[#191919]/80" : "bg-white/80",
        isSidebarOpen ? "px-4" : "pl-28 pr-4"
      )}>
        <div className="flex items-center space-x-1 text-sm opacity-60 overflow-hidden">
          {getBreadcrumbs().map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <span className="mx-1">/</span>}
              <button 
                className="notion-hover px-1.5 py-0.5 rounded-sm truncate max-w-[150px]"
                onClick={() => setCurrentPageId(crumb.id)}
              >
                {crumb.icon} {crumb.title}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button 
              className={cn(
                "p-1.5 notion-hover rounded-md transition-opacity",
                showMoreMenu ? "opacity-100 bg-gray-500/10" : "opacity-40"
              )}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="更多选项"
            >
              <MoreHorizontal size={18} />
            </button>

            <AnimatePresence>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className={cn(
                      "absolute right-0 top-full mt-2 w-56 rounded-lg shadow-xl border z-50 py-1.5 overflow-hidden",
                      isDarkMode ? "bg-[#252525] border-gray-700" : "bg-white border-gray-200"
                    )}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold opacity-40 uppercase tracking-wider">
                      数据管理
                    </div>
                    <button 
                      onClick={() => { handleJsonExport(); setShowMoreMenu(false); }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm notion-hover text-left"
                    >
                      <Download size={14} className="opacity-60" />
                      <span>导出 JSON 备份</span>
                    </button>
                    <label className="w-full flex items-center space-x-2 px-3 py-2 text-sm notion-hover cursor-pointer">
                      <Upload size={14} className="opacity-60" />
                      <span>导入 JSON 备份</span>
                      <input type="file" className="hidden" accept=".json" onChange={(e) => { handleJsonImport(e); setShowMoreMenu(false); }} />
                    </label>

                    <div className="h-[1px] my-1.5 bg-gray-500/10" />
                    
                    <div className="px-3 py-1.5 text-[10px] font-bold opacity-40 uppercase tracking-wider">
                      当前页面
                    </div>
                    <button 
                      onClick={() => { handleExport(); setShowMoreMenu(false); }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm notion-hover text-left"
                    >
                      <FileJson size={14} className="opacity-60" />
                      <span>导出 Markdown</span>
                    </button>
                    <label className="w-full flex items-center space-x-2 px-3 py-2 text-sm notion-hover cursor-pointer">
                      <Settings size={14} className="opacity-60" />
                      <span>导入 Markdown</span>
                      <input type="file" className="hidden" accept=".md" onChange={(e) => { handleImport(e); setShowMoreMenu(false); }} />
                    </label>

                    <div className="h-[1px] my-1.5 bg-gray-500/10" />

                    <button 
                      onClick={() => { setShowHelpModal(true); setShowMoreMenu(false); }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm notion-hover text-left"
                    >
                      <HelpCircle size={14} className="opacity-60" />
                      <span>快捷键与 Markdown 指南</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <HelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
        isDarkMode={isDarkMode} 
      />

      <ToastContainer toasts={toasts} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto" onClick={handleContentClick}>
        <motion.div 
          key={page.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto w-full px-12 pt-20 pb-[50vh] min-h-full cursor-text"
          onClick={handleContentClick}
        >
        {/* Page Header */}
        <div className="group relative mb-8">
          <div 
            className={cn(
              "text-7xl mb-4 cursor-pointer w-fit p-2 rounded-xl transition-colors relative",
              isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setEmojiPickerPos({ top: rect.bottom + 10, left: rect.left });
              setShowEmojiPicker(true);
            }}
          >
            {page.icon}
            
            <AnimatePresence>
              {showEmojiPicker && (
                <EmojiPicker 
                  onSelect={(emoji) => updatePage(page.id, { icon: emoji })}
                  onClose={() => setShowEmojiPicker(false)}
                  className="fixed"
                  style={{ top: emojiPickerPos.top, left: emojiPickerPos.left }}
                />
              )}
            </AnimatePresence>
          </div>
          <input 
            type="text"
            className={cn(
              "text-4xl font-bold w-full notion-input transition-colors",
              isDarkMode ? "placeholder:text-gray-800" : "placeholder:text-gray-200"
            )}
            placeholder="无标题"
            value={page.title}
            onChange={(e) => updatePage(page.id, { title: e.target.value })}
          />
        </div>

        {/* Blocks */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={page.blocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {page.blocks.map((block, index) => (
                <BlockItem 
                  key={block.id} 
                  block={block} 
                  pageId={page.id} 
                  index={index} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        </motion.div>
      </div>
    </div>
  );
};
