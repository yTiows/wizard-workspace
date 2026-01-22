import { AnimatePresence } from 'framer-motion';
import { useWindowStore } from '@/stores/windowStore';
import { WindowFrame } from './WindowFrame';
import { TerminalApp } from '@/components/apps/TerminalApp';
import { AppId } from '@/types/wizard';

const AppRenderer = ({ appId }: { appId: AppId }) => {
  switch (appId) {
    case 'terminal':
      return <TerminalApp />;
    default:
      return (
        <div className="h-full flex items-center justify-center text-foreground-muted">
          <div className="text-center">
            <p className="text-4xl mb-4">🚧</p>
            <p className="text-sm">App under construction</p>
            <p className="text-xs mt-2 text-foreground-subtle">Use Terminal for now</p>
          </div>
        </div>
      );
  }
};

export const WindowManager = () => {
  const { windows } = useWindowStore();

  return (
    <AnimatePresence>
      {windows.map((win) => (
        <WindowFrame key={win.id} window={win}>
          <AppRenderer appId={win.appId as AppId} />
        </WindowFrame>
      ))}
    </AnimatePresence>
  );
};
