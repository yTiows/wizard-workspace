import { useSystemStore } from '@/stores/systemStore';
import { StatusBar } from '@/components/os/StatusBar';
import { Dock } from '@/components/os/Dock';
import { WindowManager } from '@/components/os/WindowManager';
import { BootScreen } from '@/components/os/BootScreen';

const Desktop = () => {
  const { user } = useSystemStore();
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-background bg-grid relative">
      {/* Background noise overlay */}
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_100%)] opacity-40 pointer-events-none" />
      
      {/* Status bar */}
      <StatusBar />
      
      {/* Desktop area */}
      <div className="relative h-[calc(100vh-32px-72px)]">
        {/* Welcome message if no windows */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30">
            <h1 className="font-display text-6xl font-bold text-terminal tracking-wider mb-4">
              WIZARD
            </h1>
            <p className="text-foreground-muted text-lg">
              Welcome, <span className="text-terminal">{user?.username}</span>
            </p>
            <p className="text-foreground-subtle text-sm mt-2">
              Click an app in the dock to begin
            </p>
          </div>
        </div>
        
        {/* Windows */}
        <WindowManager />
      </div>
      
      {/* Dock */}
      <Dock />
    </div>
  );
};

const Index = () => {
  const { isBooted, isAuthenticated } = useSystemStore();
  
  if (!isBooted || !isAuthenticated) {
    return <BootScreen />;
  }
  
  return <Desktop />;
};

export default Index;
