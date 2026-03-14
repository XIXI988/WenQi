import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, 
  Book, 
  Dog, 
  Apple, 
  Coffee, 
  CloudSun,
  X
} from 'lucide-react';
import { cn } from '../utils';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const CATEGORIES = [
  { 
    id: 'basic', 
    name: '常用', 
    icon: Smile, 
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😻', '😼', '😽', '🙀', '😿', '😾', '🤲', '👐', '🙌', '👏', '🤝', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '💍', '💄', '💋', '👄', '🦷', '👅', '👂', '🦻', '👃', '👣', '👁', '👀', '🧠', '🗣', '👤', '👥', '🫂', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '✅', '❌', '✨', '🔥', '💡', '💢', '💯', '💤', '💨', '💦', '💥', '💫', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '♨️'
    ] 
  },
  { 
    id: 'books', 
    name: '学习', 
    icon: Book, 
    emojis: [
      '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒', '📔', '📒', '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🎓', '🧠', '🏫', '🔬', '🧪', '🔭', '📡', '💡', '🔍', '🔎', '🧮', '🧾', '🧳'
    ] 
  },
  { 
    id: 'animals', 
    name: '动物', 
    icon: Dog, 
    emojis: [
      '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞', '🦗', '🕷️', '🕸️', '🦂', '🦟', '🪰', '🪱', '🦠', '🦓', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻'
    ] 
  },
  { 
    id: 'fruits', 
    name: '水果', 
    icon: Apple, 
    emojis: [
      '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥣', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯'
    ] 
  },
  { 
    id: 'food', 
    name: '美食', 
    icon: Coffee, 
    emojis: [
      '🍜', '🍝', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂', '🥗', '🥘', '🍲', '🍳', '🧇', '🥞', '🥯', '🥨', '🥖', '🥐', '🍞', '🧀', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🫕', '🥫', '🍠', '🧁', '🫖', '🔪', '🏺'
    ] 
  },
  { 
    id: 'weather', 
    name: '天气', 
    icon: CloudSun, 
    emojis: [
      '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☔', '💧', '💦', '🫧', '🌊', '🌋', '🌌', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌡️', '🌝', '🌞', '🪐', '⭐', '🌟', '🌠', '🌀', '🌂', '☂️', '⛱️', '⚡', '☄️', '🔥'
    ] 
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, className, style }) => {
  const { isDarkMode } = useApp();
  const [activeCategory, setActiveCategory] = useState('basic');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      style={style}
      className={cn(
        "absolute z-50 rounded-xl shadow-xl w-72 overflow-hidden flex flex-col transition-colors",
        isDarkMode ? "bg-[#252525] border border-gray-700" : "bg-white border border-gray-200",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header / Tabs */}
      <div className={cn(
        "flex items-center border-b p-1",
        isDarkMode ? "border-gray-700 bg-[#2d2d2d]/50" : "border-gray-100 bg-gray-50/50"
      )}>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "flex-1 flex flex-col items-center py-2 rounded-lg transition-all",
              activeCategory === category.id 
                ? (isDarkMode ? "bg-gray-800 text-blue-400 shadow-sm" : "bg-white text-blue-600 shadow-sm") 
                : (isDarkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50")
            )}
            title={category.name}
          >
            <category.icon size={18} />
            <span className="text-[10px] mt-0.5 font-medium">{category.name}</span>
          </button>
        ))}
        <button 
          onClick={onClose}
          className={cn(
            "p-2 rounded-lg ml-1 transition-colors",
            isDarkMode ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          )}
        >
          <X size={16} />
        </button>
      </div>

      {/* Emoji Grid */}
      <div className="p-3 max-h-64 overflow-y-auto grid grid-cols-5 gap-2">
        {currentCategory.emojis.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className={cn(
              "text-2xl p-2 rounded-lg transition-colors flex items-center justify-center",
              isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className={cn(
        "px-3 py-2 border-t",
        isDarkMode ? "border-gray-700 bg-[#2d2d2d]/30" : "border-gray-100 bg-gray-50/30"
      )}>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider opacity-50">
          {currentCategory.name}
        </span>
      </div>
    </motion.div>
  );
};
