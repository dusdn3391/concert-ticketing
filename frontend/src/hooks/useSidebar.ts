import { useState, useEffect } from 'react';

const SIDEBAR_STORAGE_KEY = 'concert-manager-sidebar-open';

interface UseSidebarReturn {
  isOpen: boolean;
  isLoaded: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useSidebar = (defaultOpen: boolean = true): UseSidebarReturn => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (savedState !== null) {
        setIsOpen(JSON.parse(savedState));
      }
    } catch (error) {
      console.log('localStore에서 사이드바 상태를 불러오지 못했습니다: ', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 상태 변경 시 로컬 스토리지에 저장
  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.log('localStore에서 사이드바 상태를 불러오지 못했습니다: ', error);
    }
  };

  const setSidebarOpen = (open: boolean) => {
    setIsOpen(open);

    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(open));
    } catch (error) {
      console.log('localStore에서 사이드바 상태를 불러오지 못했습니다: ', error);
    }
  };

  return {
    isOpen,
    isLoaded,
    toggleSidebar,
    setSidebarOpen,
  };
};
