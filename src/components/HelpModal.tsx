import React from 'react';
import { motion } from 'motion/react';
import { X, Keyboard, FileText, Info } from 'lucide-react';
import { cn } from '../utils';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Enter', desc: '在下方添加新块' },
    { key: 'Backspace', desc: '在空块中删除当前块' },
    { key: '/', desc: '打开斜杠菜单' },
    { key: 'Ctrl/Cmd + P', desc: '搜索页面或内容' },
    { key: 'Ctrl/Cmd + Z', desc: '撤销上一步操作' },
    { key: 'Ctrl/Cmd + Shift + L', desc: '切换暗黑模式' },
    { key: 'Ctrl/Cmd + \\', desc: '切换侧边栏显示' },
  ];

  const markdown = [
    { cmd: '# ', desc: '一级标题' },
    { cmd: '## ', desc: '二级标题' },
    { cmd: '### ', desc: '三级标题' },
    { cmd: '> ', desc: '引用' },
    { cmd: '- [ ] ', desc: '待办事项' },
    { cmd: '- ', desc: '无序列表' },
    { cmd: '1. ', desc: '有序列表' },
    { cmd: '``` ', desc: '代码块' },
    { cmd: '---', desc: '分割线' },
    { cmd: '**文本**', desc: '加粗' },
    { cmd: '*文本*', desc: '斜体' },
    { cmd: '~~文本~~', desc: '删除线' },
    { cmd: '[链接](url)', desc: '插入链接' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl shadow-2xl flex flex-col",
          isDarkMode ? "bg-[#252525] text-gray-200" : "bg-white text-[#37352f]"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2 font-semibold">
            <Info size={18} />
            <span>使用指南</span>
          </div>
          <button onClick={onClose} className="p-1 notion-hover rounded-md">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Shortcuts */}
          <section>
            <div className="flex items-center space-x-2 mb-4 text-sm font-bold opacity-50 uppercase tracking-wider">
              <Keyboard size={16} />
              <span>快捷键</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md border border-transparent hover:border-gray-500/20 transition-colors">
                  <span className="text-sm">{s.desc}</span>
                  <kbd className={cn(
                    "px-2 py-1 rounded text-[10px] font-mono shadow-sm",
                    isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                  )}>{s.key}</kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Markdown */}
          <section>
            <div className="flex items-center space-x-2 mb-4 text-sm font-bold opacity-50 uppercase tracking-wider">
              <FileText size={16} />
              <span>Markdown 命令</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {markdown.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md border border-transparent hover:border-gray-500/20 transition-colors">
                  <span className="text-sm">{m.desc}</span>
                  <code className={cn(
                    "px-2 py-1 rounded text-[10px] font-mono",
                    isDarkMode ? "bg-gray-800 text-blue-400" : "bg-blue-50 text-blue-600"
                  )}>{m.cmd}</code>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 border-t text-center opacity-40 text-xs">
          文栖 - 极简个人知识库
        </div>
      </motion.div>
    </div>
  );
};
