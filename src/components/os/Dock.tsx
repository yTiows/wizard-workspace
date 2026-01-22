import { motion } from 'framer-motion';
import { useWindowStore, APP_DEFINITIONS } from '@/stores/windowStore';
import { AppId } from '@/types/wizard';

const DOCK_APPS: AppId[] = [
  'terminal',
  'files',
  'editor',
  'missions',
  'skills',
  'logs',
  'network',
  'notes',
  'snapshots',
  'mentor',
  'settings',
];

export const Dock = () => {
  const { windows, openWindow, focusWindow, minimizeWindow } = useWindowStore();

  const handleAppClick = (appId: AppId) => {
    const existingWindows = windows.filter(w => w.appId === appId);
    const app = APP_DEFINITIONS[appId];
    
    if (app.singleton && existingWindows.length > 0) {
      // Toggle minimize/focus for singleton apps
      const window = existingWindows[0];
      if (window.isMinimized || !window.isFocused) {
        focusWindow(window.id);
      } else {
        minimizeWindow(window.id);
      }
    } else if (existingWindows.length > 0) {
      // Focus the first window of this app
      const window = existingWindows[0];
      if (window.isMinimized || !window.isFocused) {
        focusWindow(window.id);
      } else {
        // Open new instance
        openWindow(appId);
      }
    } else {
      openWindow(appId);
    }
  };

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-1 px-3 py-2 bg-[hsl(var(--dock-bg))] border border-[hsl(var(--dock-border))] rounded-lg backdrop-blur-sm">
        {DOCK_APPS.map((appId) => {
          const app = APP_DEFINITIONS[appId];
          const appWindows = windows.filter(w => w.appId === appId);
          const hasWindow = appWindows.length > 0;
          const isActive = appWindows.some(w => w.isFocused);
          const isMinimized = appWindows.every(w => w.isMinimized);

          return (
            <motion.button
              key={appId}
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAppClick(appId)}
              className={`relative w-11 h-11 flex items-center justify-center rounded-lg transition-colors ${
                isActive 
                  ? 'bg-terminal-dim/30' 
                  : 'hover:bg-background-overlay'
              }`}
              title={app.name}
            >
              <span className="text-xl">{app.icon}</span>
              
              {/* Active indicator */}
              {hasWindow && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isActive 
                      ? 'bg-terminal shadow-[0_0_6px_hsl(var(--terminal))]' 
                      : isMinimized
                        ? 'bg-foreground-subtle'
                        : 'bg-terminal-dim'
                  }`}
                />
              )}
            </motion.button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-8 bg-border mx-1" />

        {/* Minimized windows */}
        {windows.filter(w => w.isMinimized).map(window => {
          const app = APP_DEFINITIONS[window.appId as AppId];
          return (
            <motion.button
              key={window.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => focusWindow(window.id)}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-background-overlay relative"
              title={window.title}
            >
              <span className="text-lg opacity-60">{app.icon}</span>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
