import { useState, useEffect } from 'react';
import { auth, signOut, onAuthStateChanged, db, doc, setDoc, serverTimestamp, onSnapshot, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { LogOut, User as UserIcon, Settings, Check, X, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Auth({ onUserChange }: { onUserChange: (user: any) => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeDoc: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Initial sync
        try {
          await setDoc(userRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || `Guest_${currentUser.uid.slice(0, 4)}`,
            photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
            lastSeen: serverTimestamp(),
            isOnline: true
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }

        unsubscribeDoc = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUser(userData);
            onUserChange(userData);
            setEditName(userData.displayName || '');
            setEditPhoto(userData.photoURL || '');
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });
      } else {
        setUser(null);
        onUserChange(null);
        if (unsubscribeDoc) unsubscribeDoc();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [onUserChange]);

  const handleGuestLogin = async () => {
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Guest Login failed:", error);
      setError("Guest Login failed. Please check your internet connection.");
    }
  };

  const handleLogout = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
      await signOut(auth);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: editName,
        photoURL: editPhoto,
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-neutral-50">
    <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
  </div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-50 p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mb-8 shadow-2xl"
        >
          <div className="relative">
            <UserIcon className="w-12 h-12 text-white" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white rounded-full"
            />
          </div>
        </motion.div>
        <h1 className="text-5xl font-light tracking-tighter text-neutral-900 mb-3">Pulse</h1>
        <p className="text-neutral-500 mb-12 max-w-xs font-light leading-relaxed">
          Instant presence. Minimalist chat.<br/>
          No email required.
        </p>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-medium max-w-xs"
          >
            {error}
          </motion.div>
        )}

        <button
          onClick={handleGuestLogin}
          className="group relative flex items-center justify-center gap-3 px-12 py-5 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all shadow-xl active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <span className="font-semibold tracking-wide">Enter Pulse Chat</span>
        </button>
        
        <p className="mt-12 text-[9px] text-neutral-400 uppercase tracking-[0.3em] font-bold">
          Privacy First • No Tracking
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4 p-4 max-w-xl mx-auto">
        <img 
          src={user.photoURL || ''} 
          alt="" 
          className="w-10 h-10 rounded-full border border-neutral-200 object-cover" 
          referrerPolicy="no-referrer" 
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-neutral-900 truncate">{user.displayName}</h2>
          <p className="text-xs text-neutral-500 font-light">Connected</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 transition-colors ${isEditing ? 'text-neutral-900 bg-neutral-100 rounded-full' : 'text-neutral-400 hover:text-neutral-900'}`}
            title="Edit Profile"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-neutral-50 border-t border-neutral-100"
          >
            <div className="p-6 max-w-xl mx-auto space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Photo URL</label>
                <input
                  type="text"
                  value={editPhoto}
                  onChange={(e) => setEditPhoto(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : <><Check className="w-4 h-4" /> Save Changes</>}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
