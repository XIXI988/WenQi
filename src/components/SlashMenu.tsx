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
  Image as ImageIcon
} from 'lucide-react';

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
  { type: 'quote', label: '引用', icon: <Quote size={16} />, description: '引用一段文字' },
  { type: 'image', label: '图片', icon: <ImageIcon size={16} />, description: '上传或嵌入图片' },
  { type: 'page', label: '子页面', icon: <FilePlus size={16} />, description: '在当前页面内创建子页面' },
  { type: 'table', label: '表格', icon: <Table size={16} />, description: '简单的二维数据表' },
  { type: 'divider', label: '分隔线', icon: <Minus size={16} />, description: '视觉上的分隔线' },
];

export const SlashMenu: React.FC<SlashMenuProps> = ({ onSelect, onClose, position }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % COMMANDS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + COMMANDS.length) % COMMANDS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(COMMANDS[selectedIndex].type);
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
  }, [selectedIndex, onSelect, onClose]);

  return (
    <div 
      ref={menuRef}
      className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-72 max-h-80 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        基础区块
      </div>
      {COMMANDS.map((cmd, idx) => (
        <div 
          key={cmd.type}
          className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${selectedIndex === idx ? 'bg-[#efefef]' : 'hover:bg-[#f5f5f5]'}`}
          onClick={() => onSelect(cmd.type)}
        >
          <div className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-md mr-3 text-gray-600">
            {cmd.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">{cmd.label}</span>
            <span className="text-xs text-gray-400">{cmd.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
