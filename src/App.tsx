import { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { PresenceList } from './components/PresenceList';
import { ChatWindow } from './components/ChatWindow';
import { updatePresence } from './firebase';
import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, Users, Shield } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Set online status
    updatePresence(currentUser.uid, true);

    // Handle tab close/visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updatePresence(currentUser.uid, false);
      } else {
        updatePresence(currentUser.uid, true);
      }
    };

    const handleBeforeUnload = () => {
      updatePresence(currentUser.uid, false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence(currentUser.uid, false);
    };
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans selection:bg-neutral-200">
      <Auth onUserChange={setCurrentUser} />
      
      {currentUser && (
        <main className="max-w-xl mx-auto pt-8 pb-24">
          <div className="px-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
                Pulse Network Active
              </span>
            </motion.div>
            <h1 className="text-5xl font-light tracking-tight text-neutral-900">
              Pulse Connect
            </h1>
            <p className="text-neutral-500 mt-4 font-light max-w-sm leading-relaxed">
              Real-time presence and private messaging for small groups. 
              Your status is visible only when you're here.
            </p>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-neutral-100 overflow-hidden mx-4">
            <PresenceList currentUser={currentUser} onSelectUser={setSelectedUser} />
          </div>

          <div className="grid grid-cols-3 gap-4 px-6 mt-12">
            <div className="flex flex-col items-center gap-2 text-center p-4 rounded-3xl bg-neutral-100/50">
              <Users className="w-5 h-5 text-neutral-400" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Live Presence</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center p-4 rounded-3xl bg-neutral-100/50">
              <MessageSquare className="w-5 h-5 text-neutral-400" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">P2P Chat</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center p-4 rounded-3xl bg-neutral-100/50">
              <Shield className="w-5 h-5 text-neutral-400" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Privacy First</span>
            </div>
          </div>
        </main>
      )}

      <AnimatePresence>
        {selectedUser && (
          <ChatWindow
            currentUser={currentUser}
            targetUser={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <div className="px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-neutral-100 shadow-sm">
          <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-300">
            Minimalist Presence System v1.0
          </span>
        </div>
      </div>
    </div>
  );
}
