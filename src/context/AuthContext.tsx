import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  updateProfile as updateAuthProfile
} from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  getUserProfile, 
  saveUserProfile, 
  updateUserXPAndStreak,
  savePracticeSession as fbSaveSession,
  logPronunciationMistake as fbLogMistake
} from '../services/firebase';
import { UserProfile, CEFRLevel, PracticeSession, PronunciationLog } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  updateProfileLevel: (level: CEFRLevel) => Promise<void>;
  recordCompletedLesson: (lessonId: string, xpEarned: number) => Promise<void>;
  saveSessionStats: (session: PracticeSession) => Promise<void>;
  addPronunciationMistake: (mistake: Omit<PronunciationLog, 'id' | 'createdAt'>) => Promise<void>;
  updateReminderSettings: (settings: { reminderEnabled?: boolean; reminderTime?: string; dailyXpGoal?: number }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_GUEST_PROFILE: UserProfile = {
  uid: 'guest_user',
  email: 'guest@teachme.app',
  displayName: 'Student (Guest)',
  level: 'A2',
  xp: 120,
  streak: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedLessonIds: ['lesson_a1_1'],
  reminderEnabled: true,
  reminderTime: '20:00',
  dailyXpGoal: 50,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('teachme_is_guest') === 'true';
  });

  const loadUserProfile = async (fbUser: FirebaseUser) => {
    try {
      let p = await getUserProfile(fbUser.uid);
      if (!p) {
        // Create initial profile
        const initialLevel: CEFRLevel = (localStorage.getItem('teachme_assigned_level') as CEFRLevel) || 'A1';
        p = {
          uid: fbUser.uid,
          email: fbUser.email || 'user@teachme.app',
          displayName: fbUser.displayName || 'English Learner',
          photoURL: fbUser.photoURL || undefined,
          level: initialLevel,
          xp: 50,
          streak: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          completedLessonIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(p);
      }
      setProfile(p);
    } catch (err) {
      console.error('Failed to load user profile from Firestore:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('teachme_is_guest');
        await loadUserProfile(currentUser);
      } else {
        // Check if guest profile exists in local storage
        const savedGuest = localStorage.getItem('teachme_guest_profile');
        if (savedGuest) {
          try {
            setProfile(JSON.parse(savedGuest));
          } catch {
            setProfile(DEFAULT_GUEST_PROFILE);
          }
        } else {
          setProfile(DEFAULT_GUEST_PROFILE);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save guest profile changes to localStorage
  useEffect(() => {
    if (!user && profile) {
      localStorage.setItem('teachme_guest_profile', JSON.stringify(profile));
    }
  }, [user, profile]);

  const signInGoogle = async () => {
    setLoading(true);
    try {
      const u = await loginWithGoogle();
      await loadUserProfile(u);
    } finally {
      setLoading(false);
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const u = await loginWithEmail(email, pass);
      await loadUserProfile(u);
    } finally {
      setLoading(false);
    }
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const u = await registerWithEmail(email, pass);
      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, { displayName: name });
      }
      const initialLevel: CEFRLevel = (localStorage.getItem('teachme_assigned_level') as CEFRLevel) || 'A1';
      const newP: UserProfile = {
        uid: u.uid,
        email: u.email || email,
        displayName: name,
        level: initialLevel,
        xp: 50,
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        completedLessonIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveUserProfile(newP);
      setProfile(newP);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setProfile(DEFAULT_GUEST_PROFILE);
      setIsGuest(true);
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('teachme_is_guest', 'true');
    if (!profile) {
      setProfile(DEFAULT_GUEST_PROFILE);
    }
  };

  const updateProfileLevel = async (level: CEFRLevel) => {
    localStorage.setItem('teachme_assigned_level', level);
    if (user && profile) {
      const updated = { ...profile, level, updatedAt: new Date().toISOString() };
      setProfile(updated);
      await saveUserProfile(updated);
    } else if (profile) {
      setProfile({ ...profile, level });
    }
  };

  const recordCompletedLesson = async (lessonId: string, xpEarned: number) => {
    if (user && profile) {
      const updated = await updateUserXPAndStreak(user.uid, xpEarned, lessonId);
      if (updated) setProfile(updated);
    } else if (profile) {
      const completed = profile.completedLessonIds.includes(lessonId)
        ? profile.completedLessonIds
        : [...profile.completedLessonIds, lessonId];
      const updated: UserProfile = {
        ...profile,
        xp: profile.xp + xpEarned,
        completedLessonIds: completed,
      };
      setProfile(updated);
    }
  };

  const saveSessionStats = async (session: PracticeSession) => {
    if (user) {
      await fbSaveSession(session);
      // Give XP bonus for voice session
      await updateUserXPAndStreak(user.uid, session.score);
      const refreshed = await getUserProfile(user.uid);
      if (refreshed) setProfile(refreshed);
    } else if (profile) {
      setProfile((prev) => prev ? ({ ...prev, xp: prev.xp + session.score }) : prev);
    }
  };

  const addPronunciationMistake = async (mistake: Omit<PronunciationLog, 'id' | 'createdAt'>) => {
    if (user) {
      await fbLogMistake(user.uid, mistake);
    }
  };

  const updateReminderSettings = async (settings: { reminderEnabled?: boolean; reminderTime?: string; dailyXpGoal?: number }) => {
    if (user && profile) {
      const updated: UserProfile = {
        ...profile,
        ...settings,
        updatedAt: new Date().toISOString(),
      };
      setProfile(updated);
      await saveUserProfile(updated);
    } else if (profile) {
      const updated: UserProfile = {
        ...profile,
        ...settings,
      };
      setProfile(updated);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      if (p) setProfile(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isGuest,
        signInGoogle,
        signInEmail,
        signUpEmail,
        logout,
        continueAsGuest,
        updateProfileLevel,
        recordCompletedLesson,
        saveSessionStats,
        addPronunciationMistake,
        updateReminderSettings,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
