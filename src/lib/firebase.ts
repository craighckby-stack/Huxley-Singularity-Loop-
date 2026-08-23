import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
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
  }
}

export const handleFirestoreError = (error: any, operationType: any, path: string | null): never => {
  const user = auth.currentUser;
  const errorInfo: FirebaseErrorInfo = {
    error: error.message,
    operationType,
    path,
    authInfo: {
      userId: user?.uid || 'anonymous',
      email: user?.email || 'none',
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous ?? true
    }
  };
  throw new Error(JSON.stringify(errorInfo));
};

export const saveSiphonedChunk = async (chunk: Chunk) => {
  if (!auth.currentUser) return;
  try {
    const chunkRef = collection(db, 'siphoned_chunks');
    // Sanitize chunk to remove undefined values
    const data: any = {
      title: chunk.title,
      file: chunk.file,
      code: chunk.code,
      explanation: chunk.explanation,
      mutation: chunk.mutation,
      intentAlignmentScore: chunk.intentAlignmentScore,
      philosophyCheck: chunk.philosophyCheck,
      ccrrScore: chunk.ccrrScore,
      suggestedBranchName: chunk.suggestedBranchName,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    };
    if (chunk.isCriticalUpgrade !== undefined) {
      data.isCriticalUpgrade = chunk.isCriticalUpgrade;
    }
    await addDoc(chunkRef, data);
  } catch (e) {
    handleFirestoreError(e, 'create', 'siphoned_chunks');
  }
};

export const getSiphonedChunks = async () => {
  if (!auth.currentUser) return [];
  try {
    const q = query(collection(db, 'siphoned_chunks'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (e) {
    handleFirestoreError(e, 'list', 'siphoned_chunks');
  }
};

export const saveArchetype = async (archetype: string) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'system_archetypes', auth.currentUser.uid);
    await setDoc(docRef, {
      archetype,
      userId: auth.currentUser.uid,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, 'update', `system_archetypes/${auth.currentUser.uid}`);
  }
};

export const getArchetype = async () => {
  if (!auth.currentUser) return null;
  try {
    const docRef = doc(db, 'system_archetypes', auth.currentUser.uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().archetype : null;
  } catch (e) {
    handleFirestoreError(e, 'get', `system_archetypes/${auth.currentUser.uid}`);
  }
};

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => auth.signOut();
