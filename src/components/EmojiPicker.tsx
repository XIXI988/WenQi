import React, { useState, useEffect, useRef } from 'react';
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
        "absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-72 overflow-hidden flex flex-col",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header / Tabs */}
      <div className="flex items-center border-b border-gray-100 p-1 bg-gray-50/50">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "flex-1 flex flex-col items-center py-2 rounded-lg transition-all",
              activeCategory === category.id 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
            )}
            title={category.name}
          >
            <category.icon size={18} />
            <span className="text-[10px] mt-0.5 font-medium">{category.name}</span>
          </button>
        ))}
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg ml-1"
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
            className="text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/30">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          {currentCategory.name}
        </span>
      </div>
    </motion.div>
  );
};
