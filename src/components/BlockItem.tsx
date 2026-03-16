import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Block, BlockType } from '../types';
import { GripVertical, Trash2, Plus, ChevronRight, ChevronDown, Smile, Image as ImageIcon, Quote as QuoteIcon, Copy, Check } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../utils';
import { SlashMenu } from './SlashMenu';
import { EmojiPicker } from './EmojiPicker';
import { AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';

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
    setFocusedBlockId,
    isDarkMode
  } = useApp();
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);
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
      } else if (text.startsWith('```')) {
        updateBlock(pageId, block.id, { type: 'code', content: text.substring(3) });
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
      if (block.type === 'code') {
        // In code blocks, Enter should just add a newline
        return;
      }
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
      const newPageId = addPage(pageId, '无标题', false);
      updateBlock(pageId, block.id, { 
        type: 'page', 
        content: '', 
        properties: { targetPageId: newPageId } 
      });
    } else if (type === 'link') {
      const linkContent = '[链接文本](https://example.com)';
      updateBlock(pageId, block.id, { type: 'text', content: linkContent });
      if (contentRef.current) {
        contentRef.current.innerText = linkContent;
      }
    } else {
      const updates: Partial<Block> = { type, content: newContent };
      if (type === 'todo') {
        updates.properties = { checked: false };
      } else if (type === 'table') {
        updates.properties = { rows: [['', ''], ['', '']] };
      }
      updateBlock(pageId, block.id, updates);
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
    // Ensure content is set when focusing, especially when transitioning from non-editing state
    if (contentRef.current && contentRef.current.innerText !== block.content) {
      contentRef.current.innerText = block.content;
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Check for Ctrl+Click on links
    if ((e.ctrlKey || e.metaKey)) {
      let range: Range | null = null;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(e.clientX, e.clientY);
      } else if ((document as any).caretPositionFromPoint) {
        const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }
      
      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = range.startContainer;
        const offset = range.startOffset;
        const text = textNode.textContent || "";
        
        // Find the boundaries of the word containing the offset
        let start = offset;
        while (start > 0 && !/\s/.test(text[start - 1])) start--;
        let end = offset;
        while (end < text.length && !/\s/.test(text[end])) end++;
        
        const word = text.substring(start, end);
        if (word.startsWith('http://') || word.startsWith('https://')) {
          window.open(word, '_blank');
          return;
        }
      }
    }

    // If not already focused, focus it
    if (focusedBlockId !== block.id) {
      // Store click coordinates to position the cursor correctly after element swap
      (window as any)._lastClickPos = { x: e.clientX, y: e.clientY };
      setFocusedBlockId(block.id);
    }
  };

  useEffect(() => {
    if (contentRef.current && !isFocused.current && contentRef.current.innerText !== block.content) {
      contentRef.current.innerText = block.content;
    }
  }, [block.content, block.type]);

  useEffect(() => {
    if (focusedBlockId === block.id && contentRef.current) {
      // Set the content when gaining focus to prevent text loss
      // We do this even if isFocused is true if the innerText is empty, 
      // which handles the mount transition
      if (contentRef.current.innerText !== block.content && (!isFocused.current || contentRef.current.innerText === '')) {
        contentRef.current.innerText = block.content;
      }
      
      if (!isFocused.current) {
        contentRef.current.focus();
      }

      const lastPos = (window as any)._lastClickPos;
      const selection = window.getSelection();
      
      if (lastPos && selection) {
        // Use requestAnimationFrame to ensure layout is stable
        requestAnimationFrame(() => {
          if (!contentRef.current) return;
          
          let range: Range | null = null;
          
          // Try to get range from click coordinates
          if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(lastPos.x, lastPos.y);
          } else if ((document as any).caretPositionFromPoint) {
            const pos = (document as any).caretPositionFromPoint(lastPos.x, lastPos.y);
            if (pos) {
              range = document.createRange();
              range.setStart(pos.offsetNode, pos.offset);
              range.collapse(true);
            }
          }

          // If we found a valid range within our content, use it
          if (range && contentRef.current.contains(range.commonAncestorContainer)) {
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // Fallback: move to end if click was outside text or range finding failed
            const fallbackRange = document.createRange();
            fallbackRange.selectNodeContents(contentRef.current);
            fallbackRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(fallbackRange);
          }
          
          // Clean up
          delete (window as any)._lastClickPos;
        });
      } else if (selection) {
        // Programmatic focus (e.g., Enter key) - move to end
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [focusedBlockId, block.id, block.type]);

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

  const getControlTopClass = () => {
    switch (block.type) {
      case 'h1': return 'top-[12px]';
      case 'h2': return 'top-[10px]';
      case 'h3': return 'top-[6px]';
      case 'h4': return 'top-[6px]';
      case 'h5': return 'top-[6px]';
      case 'h6': return 'top-[6px]';
      case 'quote': return 'top-[6px]';
      case 'code': return 'top-[10px]';
      case 'image': return 'top-[10px]';
      case 'table': return 'top-[10px]';
      case 'divider': return 'top-[12px]';
      case 'page': return 'top-[6px]';
      case 'bulleted_list': return 'top-[6px]';
      case 'numbered_list': return 'top-[6px]';
      case 'todo': return 'top-[6px]';
      default: return 'top-[4px]';
    }
  };

  const controlTopClass = getControlTopClass();

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(block.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    const commonProps = {
      ref: contentRef,
      contentEditable: true,
      onInput: handleInput,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      suppressContentEditableWarning: true,
      'data-placeholder': block.type === 'text' ? '输入 / 以获取命令...' : '',
    };

    const isEditing = focusedBlockId === block.id;

    const renderMarkdown = (content: string) => (
      <div className="markdown-body pointer-events-none w-full">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({node, ...props}) => <span {...props} />,
          }}
        >
          {content || ' '}
        </ReactMarkdown>
      </div>
    );

    switch (block.type) {
      case 'h1':
        return isEditing ? (
          <div key={block.id} {...commonProps as any} className="notion-input min-h-[1.5em] focus:outline-none text-3xl font-bold py-2" />
        ) : (
          <div className="text-3xl font-bold py-2 w-full">{renderMarkdown(block.content)}</div>
        );
      case 'h2':
        return isEditing ? (
          <div key={block.id} {...commonProps as any} className="notion-input min-h-[1.5em] focus:outline-none text-2xl font-bold py-2" />
        ) : (
          <div className="text-2xl font-bold py-2 w-full">{renderMarkdown(block.content)}</div>
        );
      case 'h3':
        return isEditing ? (
          <div key={block.id} {...commonProps as any} className="notion-input min-h-[1.5em] focus:outline-none text-xl font-bold py-1" />
        ) : (
          <div className="text-xl font-bold py-1 w-full">{renderMarkdown(block.content)}</div>
        );
      case 'h4':
        return isEditing ? (
          <div key={block.id} {...commonProps as any} className="notion-input min-h-[1.5em] focus:outline-none text-lg font-bold py-1" />
        ) : (
          <div className="text-lg font-bold py-1 w-full">{renderMarkdown(block.content)}</div>
        );
      case 'h5':
        return isEditing ? (
          <div key={block.id} {...commonProps as any} className="notion-input min-h-[1.5em] focus:outline-none text-base font-bold py-1" />
        ) : (
          <div className="text-base font-bold py-1 w-full">{renderMarkdown(block.content)}</div>
        );
      case 'h6':
        return isEditing ? (
          <div key={block.id} {...commonProps as any} className="notion-input min-h-[1.5em] focus:outline-none text-sm font-bold py-1" />
        ) : (
          <div className="text-sm font-bold py-1 w-full">{renderMarkdown(block.content)}</div>
        );
      case 'quote':
        return (
          <div className="flex items-stretch py-1 w-full">
            <div className={cn("w-1 mr-4 rounded-full", isDarkMode ? "bg-gray-700" : "bg-gray-300")} />
            {isEditing ? (
              <div key={block.id} {...commonProps as any} className={cn("notion-input min-h-[1.5em] focus:outline-none flex-1 italic", isDarkMode ? "text-gray-400" : "text-gray-700")} />
            ) : (
              <div className={cn("flex-1 italic w-full", isDarkMode ? "text-gray-400" : "text-gray-700")}>{renderMarkdown(block.content)}</div>
            )}
          </div>
        );
      case 'code':
        return (
          <div className="my-2 w-full group/code relative">
            <button
              onClick={handleCopyCode}
              className={cn(
                "absolute right-2 top-2 p-1.5 rounded-md opacity-0 group-hover/code:opacity-100 transition-all z-10",
                isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-gray-400" : "bg-white hover:bg-gray-100 text-gray-500 border border-gray-200 shadow-sm"
              )}
              title="复制代码"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
            {isEditing ? (
              <div 
                key={block.id} 
                {...commonProps as any} 
                className={cn(
                  "font-mono text-sm p-4 rounded-lg border focus:outline-none w-full whitespace-pre-wrap transition-colors",
                  isDarkMode ? "bg-[#2d2d2d] border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                )}
                data-placeholder="在此输入代码..."
              />
            ) : (
              <div className={cn(
                "font-mono text-sm p-4 rounded-lg border w-full overflow-x-auto transition-colors",
                isDarkMode ? "bg-[#2d2d2d] border-gray-700" : "bg-gray-50 border-gray-200"
              )}>
                <pre className="whitespace-pre-wrap">
                  <code 
                    className="language-javascript"
                    dangerouslySetInnerHTML={{ 
                      __html: Prism.highlight(
                        block.content || '', 
                        Prism.languages.javascript, 
                        'javascript'
                      ) 
                    }} 
                  />
                </pre>
              </div>
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
                    className={cn("mt-2 text-sm italic focus:outline-none", isDarkMode ? "text-gray-500" : "text-gray-500")}
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
              <div className={cn(
                "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors cursor-pointer",
                isDarkMode ? "bg-[#252525] border-gray-800 text-gray-600 hover:bg-gray-800" : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
              )}>
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
            <span className={cn("mr-2 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", isDarkMode ? "bg-gray-500" : "bg-gray-800")} />
            {isEditing ? (
              <div key={block.id} {...commonProps as any} className="notion-input min-h-[1.5em] focus:outline-none flex-1" />
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
              <div key={block.id} {...commonProps as any} className="notion-input min-h-[1.5em] focus:outline-none flex-1" />
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
              className={cn(
                "mr-3 mt-1.5 w-4 h-4 rounded border transition-colors",
                isDarkMode ? "bg-[#2d2d2d] border-gray-700 text-blue-500" : "border-gray-300 text-blue-600"
              )}
            />
            {isEditing ? (
              <div key={block.id} {...commonProps as any} className={cn("notion-input min-h-[1.5em] focus:outline-none flex-1", block.properties?.checked && (isDarkMode ? "line-through text-gray-600" : "line-through text-gray-400"))} />
            ) : (
              <div className={cn("flex-1 w-full", block.properties?.checked && (isDarkMode ? "line-through text-gray-600" : "line-through text-gray-400"))}>
                {renderMarkdown(block.content)}
              </div>
            )}
          </div>
        );
      case 'divider':
        return <hr className={cn("my-4 border-t transition-colors", isDarkMode ? "border-gray-800" : "border-gray-200")} />;
      case 'page':
        const targetPage = block.properties?.targetPageId ? data.pages[block.properties.targetPageId] : null;
        return (
          <div 
            className={cn(
              "flex items-center p-2 notion-hover rounded-md cursor-pointer border border-transparent transition-colors",
              isDarkMode ? "hover:border-gray-800" : "hover:border-gray-200"
            )}
            onClick={() => targetPage && setCurrentPageId(targetPage.id)}
          >
            <span className="mr-2">{targetPage?.icon || '📄'}</span>
            <span className={cn("underline underline-offset-4", isDarkMode ? "decoration-gray-700" : "decoration-gray-300")}>{targetPage?.title}</span>
          </div>
        );
      case 'table':
        const rows = block.properties?.rows || [['', ''], ['', '']];
        return (
          <div className="overflow-x-auto my-4">
            <table className={cn("min-w-full border-collapse border transition-colors", isDarkMode ? "border-gray-800" : "border-gray-200")}>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className={cn("border p-2 min-w-[100px] transition-colors", isDarkMode ? "border-gray-800" : "border-gray-200")}>
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
                className="text-xs opacity-40 notion-hover px-2 py-1 rounded transition-opacity"
                onClick={() => {
                  const newRows = rows.map(r => [...r, '']);
                  updateBlock(pageId, block.id, { properties: { ...block.properties, rows: newRows } });
                }}
              >
                + 添加列
              </button>
              <button 
                className="text-xs opacity-40 notion-hover px-2 py-1 rounded transition-opacity"
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
          <div key={block.id} {...commonProps as any} className="notion-input min-h-[1.5em] focus:outline-none w-full" />
        ) : (
          <div className="min-h-[1.5em] w-full">{renderMarkdown(block.content)}</div>
        );
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="group relative flex items-start w-full mb-1 cursor-text min-h-[1.5em]"
      onMouseDown={handleMouseDown}
    >
      <div className={cn("absolute -left-2 -translate-x-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2", controlTopClass)}>
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
        className={cn("absolute -right-8 p-1 notion-hover rounded-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity", controlTopClass)}
        onClick={(e) => {
          e.stopPropagation();
          deleteBlock(pageId, block.id);
        }}
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
