import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, updateDoc, addDoc, orderBy, limit, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Presence Heartbeat
export const updatePresence = async (uid: string, isOnline: boolean) => {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating presence:", error);
  }
};

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export { signInWithPopup, onAuthStateChanged, signOut, doc, setDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, updateDoc, addDoc, orderBy, limit };
