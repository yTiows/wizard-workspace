import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export type AuthPhase = 
  | 'checking' 
  | 'first_boot' 
  | 'login' 
  | 'locked' 
  | 'authenticated';

export type SetupStep = 
  | 'welcome'
  | 'username' 
  | 'pin_create' 
  | 'pin_confirm' 
  | 'avatar' 
  | 'initializing';

export interface UserSession {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  rank: string;
  xp: number;
  created_at: string;
}

interface AuthStore {
  // State
  phase: AuthPhase;
  setupStep: SetupStep;
  session: UserSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Setup state
  setupUsername: string;
  setupPin: string;
  setupPinConfirm: string;
  
  // Login state
  loginPin: string;
  failedAttempts: number;
  lockedUntil: Date | null;
  
  // Lock screen state
  lockReason: 'inactivity' | 'manual' | 'startup' | null;
  lastActivity: Date;
  lockTimeoutMinutes: number;
  
  // Actions
  setPhase: (phase: AuthPhase) => void;
  setSetupStep: (step: SetupStep) => void;
  setSetupUsername: (username: string) => void;
  setSetupPin: (pin: string) => void;
  setSetupPinConfirm: (pin: string) => void;
  setLoginPin: (pin: string) => void;
  setError: (error: string | null) => void;
  
  // Auth operations
  checkExistingSession: () => Promise<void>;
  createAccount: () => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Lock operations
  lockScreen: (reason: 'inactivity' | 'manual') => void;
  unlock: (pin: string) => Promise<boolean>;
  recordActivity: () => void;
  
  // Reset
  resetSetup: () => void;
  resetLogin: () => void;
}

// PIN validation helpers
export const validatePin = (pin: string): { valid: boolean; error?: string } => {
  // Wizard OS uses a Windows-like 6-digit numeric PIN.
  // Keep validation minimal so users aren't blocked during setup.
  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, error: 'PIN must be exactly 6 digits (numbers only)' };
  }

  return { valid: true };
};
  
  // Check for repeating digits
  if (/^(.)\1+$/.test(pin)) {
    return { valid: false, error: 'PIN cannot be all same digits' };
  }
  
  // Check for simple sequences
  const simpleSequences = ['123456', '654321', '012345', '543210'];
  if (simpleSequences.includes(pin)) {
    return { valid: false, error: 'PIN cannot be a simple sequence' };
  }
  
  return { valid: true };
};

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }
  
  if (!/^[a-z0-9]+$/.test(username)) {
    return { valid: false, error: 'Only lowercase letters and numbers allowed' };
  }
  
  return { valid: true };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      phase: 'checking',
      setupStep: 'welcome',
      session: null,
      isLoading: false,
      error: null,
      
      setupUsername: '',
      setupPin: '',
      setupPinConfirm: '',
      
      loginPin: '',
      failedAttempts: 0,
      lockedUntil: null,
      
      lockReason: null,
      lastActivity: new Date(),
      lockTimeoutMinutes: 5,
      
      setPhase: (phase) => set({ phase }),
      setSetupStep: (setupStep) => set({ setupStep }),
      setSetupUsername: (setupUsername) => set({ setupUsername: setupUsername.toLowerCase() }),
      setSetupPin: (setupPin) => set({ setupPin }),
      setSetupPinConfirm: (setupPinConfirm) => set({ setupPinConfirm }),
      setLoginPin: (loginPin) => set({ loginPin }),
      setError: (error) => set({ error }),
      
      checkExistingSession: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Check for existing Supabase session
          const { data: { session: supaSession } } = await supabase.auth.getSession();
          
          if (supaSession?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', supaSession.user.id)
              .single();
            
            if (profile) {
              // Fetch stats
              const { data: stats } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', supaSession.user.id)
                .single();
              
              set({
                session: {
                  id: profile.id,
                  user_id: supaSession.user.id,
                  username: profile.username,
                  avatar_url: profile.avatar_url,
                  rank: stats?.rank || 'Initiate',
                  xp: stats?.xp || 0,
                  created_at: profile.created_at,
                },
                phase: 'locked',
                lockReason: 'startup',
                isLoading: false,
              });
              return;
            }
          }
          
          // Check local storage for previous user
          const storedSession = get().session;
          if (storedSession) {
            set({ phase: 'locked', lockReason: 'startup', isLoading: false });
          } else {
            set({ phase: 'first_boot', isLoading: false });
          }
        } catch (error) {
          console.error('Session check error:', error);
          set({ phase: 'first_boot', isLoading: false });
        }
      },
      
      createAccount: async () => {
        const { setupUsername, setupPin } = get();
        
        const usernameValidation = validateUsername(setupUsername);
        if (!usernameValidation.valid) {
          set({ error: usernameValidation.error });
          return false;
        }
        
        const pinValidation = validatePin(setupPin);
        if (!pinValidation.valid) {
          set({ error: pinValidation.error });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Create anonymous Supabase account with generated email
          const email = `${setupUsername}@wizard.local`;
          const password = `wizard_${setupPin}_${Date.now()}`;
          
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            }
          });
          
          if (authError) {
            // Check if username already exists by trying to match error
            if (authError.message.includes('already')) {
              set({ error: 'Username already taken', isLoading: false });
              return false;
            }
            throw authError;
          }
          
          if (!authData.user) {
            throw new Error('Failed to create account');
          }
          
          // Hash PIN using database function
          const { data: hashedPin, error: hashError } = await supabase
            .rpc('hash_pin', { pin: setupPin });
          
          if (hashError) throw hashError;
          
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              username: setupUsername,
              pin_hash: hashedPin,
              avatar_url: null, // Default wizard avatar
            });
          
          if (profileError) {
            if (profileError.message.includes('username')) {
              set({ error: 'Username already taken', isLoading: false });
              return false;
            }
            throw profileError;
          }
          
          // Create preferences
          await supabase.from('user_preferences').insert({
            user_id: authData.user.id,
          });
          
          // Create stats
          await supabase.from('user_stats').insert({
            user_id: authData.user.id,
          });
          
          // Set session
          set({
            session: {
              id: authData.user.id,
              user_id: authData.user.id,
              username: setupUsername,
              avatar_url: null,
              rank: 'Initiate',
              xp: 0,
              created_at: new Date().toISOString(),
            },
            phase: 'authenticated',
            isLoading: false,
            lastActivity: new Date(),
          });
          
          return true;
        } catch (error: unknown) {
          console.error('Account creation error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },
      
      verifyPin: async (pin: string) => {
        const { session, failedAttempts, lockedUntil } = get();
        
        // Check if locked
        if (lockedUntil && new Date() < new Date(lockedUntil)) {
          const secondsLeft = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000);
          set({ error: `System locked. Wait ${secondsLeft}s` });
          return false;
        }
        
        if (!session) {
          set({ error: 'No session found' });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Verify PIN with database
          const { data: isValid, error } = await supabase
            .rpc('verify_pin', { 
              user_id_param: session.user_id, 
              pin_param: pin 
            });
          
          if (error) throw error;
          
          if (isValid) {
            // Reset failed attempts
            await supabase.rpc('reset_failed_attempts', { 
              user_id_param: session.user_id 
            });
            
            set({
              phase: 'authenticated',
              failedAttempts: 0,
              lockedUntil: null,
              loginPin: '',
              error: null,
              isLoading: false,
              lastActivity: new Date(),
            });
            
            return true;
          } else {
            // Record failed attempt
            const { data: attempts } = await supabase
              .rpc('record_failed_attempt', { 
                user_id_param: session.user_id 
              });
            
            const newAttempts = attempts || failedAttempts + 1;
            let lockTime: Date | null = null;
            
            if (newAttempts >= 5) {
              // Lock for increasing time
              const lockSeconds = Math.pow(2, newAttempts - 4) * 60;
              lockTime = new Date(Date.now() + lockSeconds * 1000);
            }
            
            set({
              failedAttempts: newAttempts,
              lockedUntil: lockTime,
              loginPin: '',
              error: 'Incorrect PIN',
              isLoading: false,
            });
            
            return false;
          }
        } catch (error) {
          console.error('PIN verification error:', error);
          set({ error: 'Verification failed', isLoading: false });
          return false;
        }
      },
      
      logout: async () => {
        await supabase.auth.signOut();
        set({
          phase: 'first_boot',
          session: null,
          setupStep: 'welcome',
          setupUsername: '',
          setupPin: '',
          setupPinConfirm: '',
          loginPin: '',
          failedAttempts: 0,
          lockedUntil: null,
          error: null,
        });
      },
      
      lockScreen: (reason) => {
        const { phase } = get();
        if (phase === 'authenticated') {
          set({ 
            phase: 'locked', 
            lockReason: reason,
            loginPin: '',
            error: null,
          });
        }
      },
      
      unlock: async (pin: string) => {
        return get().verifyPin(pin);
      },
      
      recordActivity: () => {
        set({ lastActivity: new Date() });
      },
      
      resetSetup: () => {
        set({
          setupStep: 'welcome',
          setupUsername: '',
          setupPin: '',
          setupPinConfirm: '',
          error: null,
        });
      },
      
      resetLogin: () => {
        set({
          loginPin: '',
          error: null,
        });
      },
    }),
    {
      name: 'wizard-auth',
      partialize: (state) => ({
        session: state.session,
        lockTimeoutMinutes: state.lockTimeoutMinutes,
      }),
    }
  )
);

// Activity tracker hook
export const useActivityTracker = () => {
  const { recordActivity, phase, lockScreen, lastActivity, lockTimeoutMinutes } = useAuthStore();
  
  // Check for inactivity
  const checkInactivity = () => {
    if (phase !== 'authenticated') return;
    
    const now = new Date();
    const timeSinceActivity = (now.getTime() - new Date(lastActivity).getTime()) / 1000 / 60;
    
    if (timeSinceActivity >= lockTimeoutMinutes) {
      lockScreen('inactivity');
    }
  };
  
  return { recordActivity, checkInactivity };
};
