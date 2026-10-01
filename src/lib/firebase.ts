/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/lib/firebase.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Chunk } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface FirebaseErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
  };
}

export const handleFirestoreError = (
  error: unknown,
  operationType: FirebaseErrorInfo['operationType'],
  path: string | null
): never => {
  const user = auth.currentUser;
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorInfo: FirebaseErrorInfo = {
    error: errorMessage,
    operationType,
    path,
    authInfo: {
      userId: user?.uid || 'anonymous',
      email: user?.email || 'none',
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous ?? true,
    },
  };
  throw new Error(JSON.stringify(errorInfo));
};

const sanitizeString = (val: unknown, maxLength: number = 50000): string => {
  if (typeof val !== 'string') return '';
  return val.slice(0, Math.max(0, maxLength));
};

const sanitizeNumber = (
  val: unknown,
  min: number = -1e9,
  max: number = 1e9,
  defaultVal: number = 0
): number => {
  if (typeof val !== 'number' || Number.isNaN(val)) return defaultVal;
  return Math.max(min, Math.min(max, val));
};

export const saveSiphonedChunk = async (chunk: Chunk): Promise<void> => {
  if (!auth.currentUser) return;
  if (!chunk || typeof chunk !== 'object') {
    throw new Error('Invalid chunk object provided for save operations.');
  }

  try {
    const chunkRef = collection(db, 'siphoned_chunks');

    const data: Record<string, unknown> = {
      title: sanitizeString(chunk.title, 500),
      file: sanitizeString(chunk.file, 1000),
      code: sanitizeString(chunk.code, 100000),
      explanation: sanitizeString(chunk.explanation, 20000),
      mutation: sanitizeString(chunk.mutation, 5000),
      intentAlignmentScore: sanitizeNumber(chunk.intentAlignmentScore, 0, 1, 0),
      philosophyCheck: typeof chunk.philosophyCheck === 'boolean' ? chunk.philosophyCheck : false,
      ccrrScore: sanitizeNumber(chunk.ccrrScore, 0, 100, 0),
      suggestedBranchName: sanitizeString(chunk.suggestedBranchName, 200),
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    };

    if (chunk.isCriticalUpgrade !== undefined) {
      data.isCriticalUpgrade = Boolean(chunk.isCriticalUpgrade);
    }

    await addDoc(chunkRef, data);
  } catch (e) {
    handleFirestoreError(e, 'create', 'siphoned_chunks');
  }
};

export const getSiphonedChunks = async (): Promise<any[]> => {
  if (!auth.currentUser) return [];
  try {
    const q = query(
      collection(db, 'siphoned_chunks'),
      where('userId', '==', auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })) as any[];
  } catch (e) {
    handleFirestoreError(e, 'list', 'siphoned_chunks');
  }
};

export const saveArchetype = async (archetype: string): Promise<void> => {
  if (!auth.currentUser) return;
  const sanitizedArchetype = sanitizeString(archetype, 1000);
  try {
    const docRef = doc(db, 'system_archetypes', auth.currentUser.uid);
    await setDoc(docRef, {
      archetype: sanitizedArchetype,
      userId: auth.currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    handleFirestoreError(e, 'update', `system_archetypes/${auth.currentUser.uid}`);
  }
};

export const getArchetype = async (): Promise<string | null> => {
  if (!auth.currentUser) return null;
  try {
    const docRef = doc(db, 'system_archetypes', auth.currentUser.uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return typeof data.archetype === 'string' ? data.archetype : null;
  } catch (e) {
    handleFirestoreError(e, 'get', `system_archetypes/${auth.currentUser.uid}`);
  }
};

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => auth.signOut();
