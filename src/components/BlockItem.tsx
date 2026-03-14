import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Block, BlockType } from '../types';
import { GripVertical, Trash2, Plus, ChevronRight, ChevronDown, Smile, Image as ImageIcon, Quote as QuoteIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../utils';
import { SlashMenu } from './SlashMenu';
import { EmojiPicker } from './EmojiPicker';
import { AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlockItemProps {
  block: Block;
  pageId: string;
  index: number;
}

export const BlockItem: React.FC<BlockItemProps> = ({ block, pageId, index }) => {
  const { 
    updateBlock, 
    deleteBlock, 
    addBlock, 
    setCurrentPageId, 
    addPage, 
    data,
    focusedBlockId,
    setFocusedBlockId
  } = useApp();
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText;
    
    // Markdown shortcuts
    if (block.type === 'text') {
      if (text.startsWith('# ')) {
        updateBlock(pageId, block.id, { type: 'h1', content: text.substring(2) });
        return;
      } else if (text.startsWith('## ')) {
        updateBlock(pageId, block.id, { type: 'h2', content: text.substring(3) });
        return;
      } else if (text.startsWith('### ')) {
        updateBlock(pageId, block.id, { type: 'h3', content: text.substring(4) });
        return;
      } else if (text.startsWith('#### ')) {
        updateBlock(pageId, block.id, { type: 'h4', content: text.substring(5) });
        return;
      } else if (text.startsWith('##### ')) {
        updateBlock(pageId, block.id, { type: 'h5', content: text.substring(6) });
        return;
      } else if (text.startsWith('###### ')) {
        updateBlock(pageId, block.id, { type: 'h6', content: text.substring(7) });
        return;
      } else if (text.startsWith('> ')) {
        updateBlock(pageId, block.id, { type: 'quote', content: text.substring(2) });
        return;
      } else if (text.startsWith('- [ ] ')) {
        updateBlock(pageId, block.id, { type: 'todo', content: text.substring(6), properties: { checked: false } });
        return;
      } else if (text.startsWith('- [x] ')) {
        updateBlock(pageId, block.id, { type: 'todo', content: text.substring(6), properties: { checked: true } });
        return;
      } else if (text.startsWith('- ') || text.startsWith('* ')) {
        updateBlock(pageId, block.id, { type: 'bulleted_list', content: text.substring(2) });
        return;
      } else if (text.startsWith('1. ')) {
        updateBlock(pageId, block.id, { type: 'numbered_list', content: text.substring(3) });
        return;
      } else if (text === '---') {
        updateBlock(pageId, block.id, { type: 'divider', content: '' });
        return;
      }
    }

    if (text.endsWith('/')) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
    
    updateBlock(pageId, block.id, { content: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showSlashMenu) {
      e.preventDefault();
      addBlock(pageId, 'text', index);
    } else if (e.key === 'Backspace' && block.content === '' && data.pages[pageId].blocks.length > 1) {
      e.preventDefault();
      deleteBlock(pageId, block.id);
    }
  };

  const handleSlashSelect = (type: BlockType) => {
    // Remove the slash
    const newContent = block.content.replace(/\/$/, '');
    
    if (type === 'page') {
      const newPageId = addPage(pageId);
      updateBlock(pageId, block.id, { 
        type: 'page', 
        content: '', 
        properties: { targetPageId: newPageId } 
      });
      // Navigate to new page
      setCurrentPageId(newPageId);
    } else {
      updateBlock(pageId, block.id, { type, content: newContent });
      // Update the DOM directly to reflect the change immediately
      if (contentRef.current) {
        contentRef.current.innerText = newContent;
      }
    }
    setShowSlashMenu(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (contentRef.current) {
      contentRef.current.focus();
      // Use execCommand for simple insertion at cursor
      document.execCommand('insertText', false, emoji);
      // The onInput will trigger updateBlock
    } else {
      // Fallback if ref is missing
      updateBlock(pageId, block.id, { content: block.content + emoji });
    }
    setShowEmojiPicker(false);
  };

  const handleFocus = () => {
    isFocused.current = true;
    setFocusedBlockId(block.id);
  };

  const handleBlur = () => {
    isFocused.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    // If not already focused, focus it
    if (focusedBlockId !== block.id) {
      setFocusedBlockId(block.id);
    }
  };

  useEffect(() => {
    if (contentRef.current && !isFocused.current && contentRef.current.innerText !== block.content) {
      contentRef.current.innerText = block.content;
    }
  }, [block.content, block.type]);

  useEffect(() => {
    if (focusedBlockId === block.id && contentRef.current && !isFocused.current) {
      // Explicitly clear if content is empty to prevent duplication from browser Enter key behavior
      if (block.content === '') {
        contentRef.current.innerText = '';
      }
      contentRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [focusedBlockId, block.id, block.content]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBlock(pageId, block.id, { 
          type: 'image', 
          properties: { ...block.properties, url: reader.result as string } 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderContent = () => {
    const commonProps = {
      key: block.id,
      ref: contentRef,
      contentEditable: true,
      onInput: handleInput,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      suppressContentEditableWarning: true,
    };

    const isEditing = focusedBlockId === block.id;

    const renderMarkdown = (content: string) => (
      <div className="markdown-body pointer-events-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ' '}</ReactMarkdown>
      </div>
    );

    switch (block.type) {
      case 'h1':
        return isEditing ? (
          <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none text-3xl font-bold py-2" />
        ) : (
          <div className="text-3xl font-bold py-2 w-full">{renderMarkdown(`# ${block.content}`)}</div>
        );
      case 'h2':
        return isEditing ? (
          <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none text-2xl font-bold py-2" />
        ) : (
          <div className="text-2xl font-bold py-2 w-full">{renderMarkdown(`## ${block.content}`)}</div>
        );
      case 'h3':
        return isEditing ? (
          <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none text-xl font-bold py-1" />
        ) : (
          <div className="text-xl font-bold py-1 w-full">{renderMarkdown(`### ${block.content}`)}</div>
        );
      case 'h4':
        return isEditing ? (
          <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none text-lg font-bold py-1" />
        ) : (
          <div className="text-lg font-bold py-1 w-full">{renderMarkdown(`#### ${block.content}`)}</div>
        );
      case 'h5':
        return isEditing ? (
          <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none text-base font-bold py-1" />
        ) : (
          <div className="text-base font-bold py-1 w-full">{renderMarkdown(`##### ${block.content}`)}</div>
        );
      case 'h6':
        return isEditing ? (
          <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none text-sm font-bold py-1" />
        ) : (
          <div className="text-sm font-bold py-1 w-full">{renderMarkdown(`###### ${block.content}`)}</div>
        );
      case 'quote':
        return (
          <div className="flex items-stretch py-1 w-full">
            <div className="w-1 bg-gray-300 mr-4 rounded-full" />
            {isEditing ? (
              <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none flex-1 italic text-gray-700" />
            ) : (
              <div className="flex-1 italic text-gray-700 w-full">{renderMarkdown(block.content)}</div>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="my-4 group/image relative">
            {block.properties?.url ? (
              <div className="relative">
                <img 
                  src={block.properties.url} 
                  alt={block.properties.caption || 'Image'} 
                  className="max-w-full rounded-lg shadow-sm"
                  referrerPolicy="no-referrer"
                />
                {isEditing ? (
                  <div 
                    className="mt-2 text-sm text-gray-500 italic focus:outline-none"
                    contentEditable
                    onInput={(e) => updateBlock(pageId, block.id, { properties: { ...block.properties, caption: e.currentTarget.innerText } })}
                    suppressContentEditableWarning
                  >
                    {block.properties.caption || '添加说明...'}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500 italic">
                    {block.properties.caption}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
                <ImageIcon size={32} className="mb-2" />
                <p className="text-sm">点击上传图片或拖入图片</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </div>
        );
      case 'bulleted_list':
        return (
          <div className="flex items-start py-1 w-full">
            <span className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-800 flex-shrink-0" />
            {isEditing ? (
              <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none flex-1" />
            ) : (
              <div className="flex-1 w-full">{renderMarkdown(block.content)}</div>
            )}
          </div>
        );
      case 'numbered_list':
        return (
          <div className="flex items-start py-1 w-full">
            <span className="mr-2 text-gray-500 font-medium">{index + 1}.</span>
            {isEditing ? (
              <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none flex-1" />
            ) : (
              <div className="flex-1 w-full">{renderMarkdown(block.content)}</div>
            )}
          </div>
        );
      case 'todo':
        return (
          <div className="flex items-start py-1 w-full">
            <input 
              type="checkbox" 
              checked={block.properties?.checked} 
              onChange={(e) => updateBlock(pageId, block.id, { properties: { ...block.properties, checked: e.target.checked } })}
              className="mr-3 mt-1.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {isEditing ? (
              <div {...commonProps} className={cn("notion-input min-h-[1.5em] focus:outline-none flex-1", block.properties?.checked && "line-through text-gray-400")} />
            ) : (
              <div className={cn("flex-1 w-full", block.properties?.checked && "line-through text-gray-400")}>
                {renderMarkdown(block.content)}
              </div>
            )}
          </div>
        );
      case 'divider':
        return <hr className="my-4 border-t border-gray-200" />;
      case 'page':
        const targetPage = block.properties?.targetPageId ? data.pages[block.properties.targetPageId] : null;
        return (
          <div 
            className="flex items-center p-2 notion-hover rounded-md cursor-pointer border border-transparent hover:border-gray-200"
            onClick={() => targetPage && setCurrentPageId(targetPage.id)}
          >
            <span className="mr-2">{targetPage?.icon || '📄'}</span>
            <span className="underline decoration-gray-300 underline-offset-4">{targetPage?.title || '无标题'}</span>
          </div>
        );
      case 'table':
        const rows = block.properties?.rows || [['', ''], ['', '']];
        return (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-gray-200">
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="border border-gray-200 p-2 min-w-[100px]">
                        <div 
                          className="notion-input min-h-[1.5em] focus:outline-none" 
                          contentEditable 
                          onInput={(e) => {
                            const newRows = [...rows];
                            newRows[rIdx][cIdx] = e.currentTarget.innerText;
                            updateBlock(pageId, block.id, { properties: { ...block.properties, rows: newRows } });
                          }}
                          suppressContentEditableWarning
                        >
                          {cell}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex space-x-2 mt-2">
              <button 
                className="text-xs text-gray-400 notion-hover px-2 py-1 rounded"
                onClick={() => {
                  const newRows = rows.map(r => [...r, '']);
                  updateBlock(pageId, block.id, { properties: { ...block.properties, rows: newRows } });
                }}
              >
                + 添加列
              </button>
              <button 
                className="text-xs text-gray-400 notion-hover px-2 py-1 rounded"
                onClick={() => {
                  const newRows = [...rows, new Array(rows[0].length).fill('')];
                  updateBlock(pageId, block.id, { properties: { ...block.properties, rows: newRows } });
                }}
              >
                + 添加行
              </button>
            </div>
          </div>
        );
      default:
        return isEditing ? (
          <div {...commonProps} className="notion-input min-h-[1.5em] focus:outline-none w-full" />
        ) : (
          <div className="min-h-[1.5em] w-full">{renderMarkdown(block.content)}</div>
        );
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="group relative flex items-start w-full mb-1"
      onClick={handleClick}
    >
      <div className="absolute -left-2 top-[2px] -translate-x-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
        <div 
          className="p-1 notion-hover rounded-sm text-gray-400 cursor-grab" 
          {...attributes} 
          {...listeners}
          title="拖动以移动此块"
        >
          <GripVertical size={16} />
        </div>
        <button 
          className="p-1 notion-hover rounded-sm text-gray-400" 
          onClick={() => addBlock(pageId, 'text', index)}
          title="在下方添加新块"
        >
          <Plus size={16} />
        </button>
        <button 
          className="p-1 notion-hover rounded-sm text-gray-400" 
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
            setShowEmojiPicker(true);
          }}
          title="插入表情符号"
        >
          <Smile size={16} />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>

      <button 
        className="absolute -right-8 top-[2px] p-1 notion-hover rounded-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => deleteBlock(pageId, block.id)}
        title="删除此块"
      >
        <Trash2 size={16} />
      </button>

      {showSlashMenu && (
        <SlashMenu 
          position={menuPosition} 
          onSelect={handleSlashSelect} 
          onClose={() => setShowSlashMenu(false)} 
        />
      )}

      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker 
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
            className="fixed"
            style={{ top: menuPosition.top + 10, left: menuPosition.left }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
