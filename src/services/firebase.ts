import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocFromServer,
  collection, 
  getDocs, 
  query, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, PronunciationLog, PracticeSession, IeltsTestResult } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: Client is offline or database initializing.');
    }
    return false;
  }
}
testConnection();

// Auth Helpers
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

// User Profile Helpers
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const now = new Date().toISOString();
    const cleanProfile: Record<string, any> = {
      uid: profile.uid,
      email: profile.email || 'user@teachme.app',
      displayName: profile.displayName || 'English Learner',
      level: profile.level || 'A1',
      xp: Math.max(0, profile.xp || 0),
      streak: Math.max(1, profile.streak || 1),
      lastActiveDate: profile.lastActiveDate || now.split('T')[0],
      completedLessonIds: profile.completedLessonIds || [],
      updatedAt: now,
    };
    if (profile.photoURL) cleanProfile.photoURL = profile.photoURL;
    if (profile.targetLanguage) cleanProfile.targetLanguage = profile.targetLanguage;
    if (profile.nativeLanguage) cleanProfile.nativeLanguage = profile.nativeLanguage;
    if (profile.reminderEnabled !== undefined) cleanProfile.reminderEnabled = profile.reminderEnabled;
    if (profile.reminderTime) cleanProfile.reminderTime = profile.reminderTime;
    if (profile.dailyXpGoal) cleanProfile.dailyXpGoal = profile.dailyXpGoal;
    if (profile.ieltsBand !== undefined) cleanProfile.ieltsBand = profile.ieltsBand;
    if (profile.totalSpokenSeconds !== undefined) cleanProfile.totalSpokenSeconds = profile.totalSpokenSeconds;
    if (!profile.createdAt) cleanProfile.createdAt = now;

    await setDoc(doc(db, 'users', profile.uid), cleanProfile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserXPAndStreak(
  uid: string, 
  xpEarned: number, 
  lessonId?: string
): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const existing = await getUserProfile(uid);
    if (!existing) return null;

    const today = new Date().toISOString().split('T')[0];
    let newStreak = existing.streak;

    if (existing.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (existing.lastActiveDate === yesterday) {
        newStreak += 1;
      } else if (!existing.lastActiveDate) {
        newStreak = 1;
      }
    }

    const completed = [...(existing.completedLessonIds || [])];
    if (lessonId && !completed.includes(lessonId)) {
      completed.push(lessonId);
    }

    const updatedData = {
      ...existing,
      xp: existing.xp + xpEarned,
      streak: newStreak,
      lastActiveDate: today,
      completedLessonIds: completed,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', uid), updatedData, { merge: true });
    return updatedData;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Pronunciation Log Helpers
export async function logPronunciationMistake(
  userId: string, 
  log: Omit<PronunciationLog, 'id' | 'createdAt'>
): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/pronunciationLogs/${logId}`;
  try {
    const payload = {
      id: logId,
      userId,
      word: log.word.toLowerCase().trim().slice(0, 100),
      phoneticTarget: log.phoneticTarget.slice(0, 100),
      feedback: log.feedback.slice(0, 500),
      createdAt: new Date().toISOString(),
      ...(log.phoneticActual ? { phoneticActual: log.phoneticActual.slice(0, 100) } : {}),
      ...(log.scenarioId ? { scenarioId: log.scenarioId.slice(0, 100) } : {}),
      ...(log.accuracy !== undefined ? { accuracy: Math.min(100, Math.max(0, log.accuracy)) } : {}),
      ...(log.occurrenceCount ? { occurrenceCount: log.occurrenceCount } : { occurrenceCount: 1 }),
    };

    await setDoc(doc(db, 'users', userId, 'pronunciationLogs', logId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserPronunciationLogs(userId: string): Promise<PronunciationLog[]> {
  const path = `users/${userId}/pronunciationLogs`;
  try {
    const q = query(collection(db, 'users', userId, 'pronunciationLogs'), limit(50));
    const snap = await getDocs(q);
    const logs: PronunciationLog[] = [];
    snap.forEach((d) => logs.push(d.data() as PronunciationLog));
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Practice Session Helpers
export async function savePracticeSession(session: PracticeSession): Promise<void> {
  const path = `users/${session.userId}/sessions/${session.id}`;
  try {
    const payload = {
      id: session.id,
      userId: session.userId,
      scenarioId: session.scenarioId,
      scenarioTitle: (session.scenarioTitle || 'Free Talk').slice(0, 150),
      durationSeconds: Math.max(0, session.durationSeconds),
      score: Math.min(100, Math.max(0, session.score)),
      turnsCount: Math.max(0, session.turnsCount),
      strengths: (session.strengths || []).slice(0, 20),
      improvements: (session.improvements || []).slice(0, 20),
      mispronouncedWords: (session.mispronouncedWords || []).slice(0, 50),
      ...(session.transcript ? { transcript: session.transcript.slice(0, 50) } : {}),
      createdAt: session.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', session.userId, 'sessions', session.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserPracticeSessions(userId: string): Promise<PracticeSession[]> {
  const path = `users/${userId}/sessions`;
  try {
    const q = query(collection(db, 'users', userId, 'sessions'), limit(20));
    const snap = await getDocs(q);
    const sessions: PracticeSession[] = [];
    snap.forEach((d) => sessions.push(d.data() as PracticeSession));
    return sessions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// IELTS Assessment Persistence Helpers
export async function saveIeltsAssessment(
  userId: string, 
  result: IeltsTestResult
): Promise<void> {
  const path = `users/${userId}/ieltsAssessments/${result.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'ieltsAssessments', result.id), result);
    // Sync level and band with User profile
    await updateUserXPAndStreak(userId, 100);
    const existing = await getUserProfile(userId);
    if (existing) {
      await saveUserProfile({
        ...existing,
        level: result.cefrEquivalent,
        ieltsBand: result.overallBand,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserIeltsAssessments(userId: string): Promise<IeltsTestResult[]> {
  const path = `users/${userId}/ieltsAssessments`;
  try {
    const q = query(collection(db, 'users', userId, 'ieltsAssessments'), limit(10));
    const snap = await getDocs(q);
    const results: IeltsTestResult[] = [];
    snap.forEach((d) => results.push(d.data() as IeltsTestResult));
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
