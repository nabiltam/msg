import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy } from '../firebase';
import { PulseIcon } from './PulseIcon';
import { motion, AnimatePresence } from 'motion/react';

export function PresenceList({ currentUser, onSelectUser }: { currentUser: any, onSelectUser: (user: any) => void }) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('isOnline', 'desc'), orderBy('displayName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs
        .map(doc => doc.data())
        .filter(u => u.uid !== currentUser.uid);
      setUsers(usersList);
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  return (
    <div className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-140px)]">
      <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-4 px-2">Live Status</h3>
      <AnimatePresence mode="popLayout">
        {users.length === 0 ? (
          <p className="text-xs text-neutral-400 px-2 italic">No other users online yet.</p>
        ) : (
          users.map((user) => (
            <motion.button
              key={user.uid}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onSelectUser(user)}
              className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-100 transition-all text-left active:scale-[0.98]"
            >
              <div className="relative">
                <img
                  src={user.photoURL || ''}
                  alt=""
                  className={`w-12 h-12 rounded-full border-2 transition-colors ${
                    user.isOnline ? 'border-green-100' : 'border-neutral-100'
                  }`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                  <PulseIcon isOnline={user.isOnline} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-950">
                  {user.displayName}
                </h4>
                <p className="text-[11px] text-neutral-500 font-light">
                  {user.isOnline ? 'Active now' : 'Offline'}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
