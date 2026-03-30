import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, limit } from '../firebase';
import { PulseIcon } from './PulseIcon';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function PresenceList({ currentUser, onSelectUser }: { currentUser: any, onSelectUser: (user: any) => void }) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      orderBy('isOnline', 'desc'), 
      orderBy('displayName', 'asc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs
        .map(doc => doc.data())
        .filter(u => u.uid !== currentUser.uid);
      setUsers(usersList);
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">In the Room</h3>
        <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
          {users.filter(u => u.isOnline).length + 1} Online
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {/* Current User */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="relative">
            <img
              src={currentUser.photoURL || ''}
              alt=""
              className="w-10 h-10 rounded-full border-2 border-neutral-900 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-0.5 -right-0.5 bg-white p-0.5 rounded-full shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
          </div>
          <span className="text-[9px] font-bold text-neutral-900 truncate w-12 text-center">You</span>
        </div>

        <AnimatePresence mode="popLayout">
          {users.map((user) => (
            <motion.button
              key={user.uid}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onSelectUser(user)}
              className="flex-shrink-0 flex flex-col items-center gap-1 group"
            >
              <div className="relative">
                <img
                  src={user.photoURL || ''}
                  alt=""
                  className={cn(
                    "w-10 h-10 rounded-full border-2 transition-all group-hover:scale-105 object-cover",
                    user.isOnline ? "border-green-400" : "border-neutral-200 opacity-50 grayscale"
                  )}
                  referrerPolicy="no-referrer"
                />
                {user.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-white p-0.5 rounded-full shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                )}
              </div>
              <span className="text-[9px] font-medium text-neutral-500 truncate w-12 text-center">
                {user.displayName.split(' ')[0]}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
