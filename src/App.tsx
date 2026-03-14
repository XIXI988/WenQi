import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { ToastContainer, useToast } from './components/Toast';
import { Menu } from 'lucide-react';
import { cn } from './utils';

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const { toasts, showToast } = useToast();
  const { currentPageId } = useApp();

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
    <div className="flex h-screen w-full overflow-hidden bg-white font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col relative min-w-0">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-3 left-4 z-40 p-1.5 notion-hover rounded-md text-gray-500 bg-white/50 backdrop-blur-sm border border-gray-200 shadow-sm"
            title="显示侧边栏"
          >
            <Menu size={20} />
          </button>
        )}
        
        <Editor />
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

