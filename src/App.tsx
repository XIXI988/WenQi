import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { ToastContainer, useToast } from './components/Toast';
import { Menu, Sun, Moon } from 'lucide-react';
import { cn } from './utils';

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const { toasts, showToast } = useToast();
  const { currentPageId, isDarkMode, toggleDarkMode, undo } = useApp();

  // Global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        // Only undo if not in an input that handles its own undo
        // But for this app, we want to undo our global state
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  // Listen for window resize to handle sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show a warning about localStorage
  useEffect(() => {
    try {
      const hasSeenWarning = localStorage.getItem('wenqi_warning_seen');
      if (!hasSeenWarning) {
        showToast('数据保存在浏览器本地，清除缓存会导致数据丢失，请定期导出备份。', 'info');
        localStorage.setItem('wenqi_warning_seen', 'true');
      }
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
  }, [showToast]);

  return (
    <div className={cn("flex h-screen w-full overflow-hidden font-sans transition-colors duration-200", isDarkMode ? "bg-[#191919] text-gray-200" : "bg-white text-[#37352f]")}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col relative min-w-0">
        <div className="fixed top-3 left-4 z-40 flex items-center space-x-2">
          {!isSidebarOpen && (
            <>
              <button 
                onClick={toggleDarkMode}
                className={cn(
                  "p-1.5 notion-hover rounded-md border shadow-sm transition-colors",
                  isDarkMode ? "bg-[#2c2c2c] border-gray-700 text-yellow-400" : "bg-white border-gray-200 text-gray-500"
                )}
                title={isDarkMode ? "切换到白天模式" : "切换到黑夜模式"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className={cn(
                  "p-1.5 notion-hover rounded-md border shadow-sm transition-colors",
                  isDarkMode ? "bg-[#2c2c2c] border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-500"
                )}
                title="显示侧边栏"
              >
                <Menu size={20} />
              </button>
            </>
          )}
        </div>
        
        <Editor isSidebarOpen={isSidebarOpen} />
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

