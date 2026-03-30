import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, db, doc, setDoc, serverTimestamp, onSnapshot, updateDoc } from '../firebase';
import { LogIn, LogOut, User as UserIcon, Settings, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Auth({ onUserChange }: { onUserChange: (user: any) => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let unsubscribeDoc: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Initial sync from Auth to Firestore if doc doesn't exist
        const docSnap = await setDoc(userRef, {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          lastSeen: serverTimestamp(),
          isOnline: true
        }, { merge: true });

        // Listen to Firestore doc for real-time profile updates
        unsubscribeDoc = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUser(userData);
            onUserChange(userData);
            setEditName(userData.displayName || '');
            setEditPhoto(userData.photoURL || '');
          }
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

  const handleLogout = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() });
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
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-blocked') {
        setError("Popup was blocked by your browser. Please allow popups for this site.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for login. Please check your Firebase settings.");
      } else {
        setError(error.message || "An unexpected error occurred during login.");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-50 p-6 text-center">
        <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-8 shadow-xl">
          <UserIcon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-light tracking-tight text-neutral-900 mb-2">Pulse Connect</h1>
        <p className="text-neutral-500 mb-8 max-w-xs font-light">Minimalist instant messaging focused on digital presence.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium max-w-xs">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="flex items-center gap-3 px-8 py-4 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <LogIn className="w-5 h-5" />
          <span className="font-medium">Sign in with Google</span>
        </button>
        
        <p className="mt-8 text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
          Make sure popups are enabled
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
