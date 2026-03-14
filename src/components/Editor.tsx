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
import { Smile, Image as ImageIcon, MoreHorizontal, Download, Upload } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '../utils';
import { serializePageToMarkdown, parseMarkdownToBlocks } from '../services/markdownService';
import { useToast, ToastContainer } from './Toast';

interface EditorProps {
  isSidebarOpen?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ isSidebarOpen = true }) => {
  const { data, currentPageId, updatePage, moveBlock, setCurrentPageId, addBlock, focusedBlockId, setFocusedBlockId, isDarkMode } = useApp();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
                {crumb.icon} {crumb.title || '无标题'}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center space-x-1 px-2 py-1 notion-hover rounded-md opacity-60 text-xs"
            onClick={handleExport}
            title="导出为 .md 文件"
          >
            <Download size={14} />
            <span>导出 Markdown</span>
          </button>
          <label className="flex items-center space-x-1 px-2 py-1 notion-hover rounded-md opacity-60 text-xs cursor-pointer" title="导入 .md 文件">
            <Upload size={14} />
            <span>导入 Markdown</span>
            <input type="file" accept=".md" className="hidden" onChange={handleImport} />
          </label>
          <button className="p-1.5 notion-hover rounded-md opacity-40">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

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
