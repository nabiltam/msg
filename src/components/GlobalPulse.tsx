import { useState, useEffect, useRef } from 'react';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from '../firebase';
import { Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export function GlobalPulse({ currentUser }: { currentUser: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'global_messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs.reverse());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'global_messages'), {
        text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending global message:", error);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neutral-900" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Global Pulse</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-neutral-400 uppercase">Live Room</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/10">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isMe && (
                  <img 
                    src={msg.senderPhoto} 
                    alt="" 
                    className="w-8 h-8 rounded-full border border-neutral-200 self-end" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[9px] font-bold text-neutral-400 mb-1 ml-1">
                      {msg.senderName}
                    </span>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-neutral-900 text-white rounded-tr-none' 
                      : 'bg-white text-neutral-900 border border-neutral-100 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.createdAt && (
                    <span className="text-[8px] text-neutral-300 mt-1 uppercase tracking-tighter">
                      {format(msg.createdAt.toDate(), 'p')}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-100 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Broadcast to the room..."
            className="w-full pl-4 pr-12 py-3 bg-neutral-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 p-2 bg-neutral-900 text-white rounded-xl disabled:opacity-50 transition-all active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
