import { useAuthStore } from '@/stores/authStore';
import { useSystemStore } from '@/stores/systemStore';
import { StatusBar } from '@/components/os/StatusBar';
import { Dock } from '@/components/os/Dock';
import { WindowManager } from '@/components/os/WindowManager';
import { BootScreen } from '@/components/os/BootScreen';
import { AuthGate } from '@/components/auth/AuthGate';
import { useEffect } from 'react';

const Desktop = () => {
  const { session } = useAuthStore();
  
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
              Welcome, <span className="text-terminal">{session?.username}</span>
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

const OSEnvironment = () => {
  const { isBooted, isAuthenticated, completeBoot, login } = useSystemStore();
  const { session } = useAuthStore();
  
  // Sync auth state with system store
  useEffect(() => {
    if (session) {
      // Complete boot and login when auth is ready
      if (!isBooted) {
        completeBoot();
      }
      if (!isAuthenticated) {
        login(session.username);
      }
    }
  }, [session, isBooted, isAuthenticated, completeBoot, login]);
  
  // Show boot screen if not booted yet
  if (!isBooted && session) {
    return <BootScreen />;
  }
  
  return <Desktop />;
};

const Index = () => {
  return (
    <AuthGate>
      <OSEnvironment />
    </AuthGate>
  );
};

export default Index;
