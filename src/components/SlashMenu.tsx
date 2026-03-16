import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { BlockType } from '../types';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  Heading4,
  Heading5,
  Heading6,
  List, 
  ListOrdered, 
  CheckSquare, 
  FilePlus, 
  Table, 
  Minus,
  Quote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';

import { cn } from '../utils';

interface SlashMenuProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

const COMMANDS: { type: BlockType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'text', label: '文本', icon: <Type size={16} />, description: '普通文本区块' },
  { type: 'h1', label: '一级标题', icon: <Heading1 size={16} />, description: '大标题' },
  { type: 'h2', label: '二级标题', icon: <Heading2 size={16} />, description: '中标题' },
  { type: 'h3', label: '三级标题', icon: <Heading3 size={16} />, description: '小标题' },
  { type: 'h4', label: '四级标题', icon: <Heading4 size={16} />, description: '更小的标题' },
  { type: 'h5', label: '五级标题', icon: <Heading5 size={16} />, description: '极小的标题' },
  { type: 'h6', label: '六级标题', icon: <Heading6 size={16} />, description: '最小的标题' },
  { type: 'bulleted_list', label: '无序列表', icon: <List size={16} />, description: '简单的项目符号列表' },
  { type: 'numbered_list', label: '有序列表', icon: <ListOrdered size={16} />, description: '带数字的列表' },
  { type: 'todo', label: '待办清单', icon: <CheckSquare size={16} />, description: '带复选框的任务' },
  { type: 'code', label: '代码块', icon: <Code size={16} />, description: '带有语法高亮的代码块' },
  { type: 'quote', label: '引用', icon: <Quote size={16} />, description: '引用一段文字' },
  { type: 'image', label: '图片', icon: <ImageIcon size={16} />, description: '上传或嵌入图片' },
  { type: 'link', label: '链接', icon: <LinkIcon size={16} />, description: '插入 Markdown 格式的链接' },
  { type: 'page', label: '子页面', icon: <FilePlus size={16} />, description: '在当前页面内创建子页面' },
  { type: 'table', label: '表格', icon: <Table size={16} />, description: '简单的二维数据表' },
  { type: 'divider', label: '分隔线', icon: <Minus size={16} />, description: '视觉上的分隔线' },
];

export const SlashMenu: React.FC<SlashMenuProps> = ({ onSelect, onClose, position }) => {
  const { isDarkMode } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase()) ||
    cmd.type.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredCommands.length === 0) {
        if (e.key === 'Escape') onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].type);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedIndex, onSelect, onClose, filteredCommands]);

  return (
    <div 
      ref={menuRef}
      className={cn(
        "fixed z-[100] rounded-lg shadow-xl border flex flex-col w-72 max-h-80 overflow-hidden transition-colors",
        isDarkMode ? "bg-[#252525] border-gray-700" : "bg-white border-gray-200"
      )}
      style={{ top: position.top, left: position.left }}
    >
      <div className={cn("p-2 border-b", isDarkMode ? "border-gray-700" : "border-gray-100")}>
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索区块..."
          className={cn(
            "w-full px-2 py-1.5 text-sm rounded border-none focus:ring-0",
            isDarkMode ? "bg-[#2d2d2d] text-gray-200 placeholder:text-gray-600" : "bg-gray-50 text-gray-800 placeholder:text-gray-400"
          )}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        />
      </div>
      <div className="overflow-y-auto py-2">
        <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider opacity-50">
          {search ? '搜索结果' : '基础区块'}
        </div>
        {filteredCommands.length > 0 ? (
          filteredCommands.map((cmd, idx) => (
            <div 
              key={cmd.type}
              className={cn(
                "flex items-center px-3 py-2 cursor-pointer transition-colors",
                selectedIndex === idx 
                  ? (isDarkMode ? "bg-gray-800" : "bg-[#efefef]") 
                  : (isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-[#f5f5f5]")
              )}
              onClick={() => onSelect(cmd.type)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className={cn(
                "w-8 h-8 flex items-center justify-center border rounded-md mr-3 transition-colors",
                isDarkMode ? "bg-[#2d2d2d] border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-600"
              )}>
                {cmd.icon}
              </div>
              <div className="flex flex-col">
                <span className={cn("text-sm font-medium", isDarkMode ? "text-gray-200" : "text-gray-800")}>{cmd.label}</span>
                <span className="text-xs text-gray-400 opacity-70">{cmd.description}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="px-3 py-4 text-center text-sm text-gray-400">
            未找到匹配的区块
          </div>
        )}
      </div>
    </div>
  );
};
