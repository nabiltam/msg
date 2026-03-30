import { useState, useEffect, useRef } from 'react';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, handleFirestoreError, OperationType } from '../firebase';
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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'global_messages');
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
      handleFirestoreError(error, OperationType.WRITE, 'global_messages');
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-[32px] overflow-hidden border border-neutral-100 shadow-xl shadow-neutral-200/50">
      {/* Header */}
      <div className="p-5 border-b border-neutral-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Pulse Room Chat</h3>
            <p className="text-[10px] text-neutral-400 font-medium">Everyone is here</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-bold text-green-700 uppercase tracking-tighter">Live Sync</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/5">
        <div className="text-center pb-8">
          <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-[0.3em]">Beginning of Pulse</span>
        </div>
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isMe && (
                  <img 
                    src={msg.senderPhoto} 
                    alt="" 
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm self-end object-cover" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  {!isMe && (
                    <span className="text-[10px] font-bold text-neutral-400 mb-1.5 ml-1">
                      {msg.senderName}
                    </span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe 
                      ? 'bg-neutral-900 text-white rounded-tr-none shadow-md shadow-neutral-900/10' 
                      : 'bg-white text-neutral-900 border border-neutral-100 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.createdAt && (
                    <span className="text-[8px] text-neutral-300 mt-1.5 uppercase tracking-tighter font-medium px-1">
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
      <form onSubmit={handleSendMessage} className="p-5 border-t border-neutral-100 bg-white">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share a pulse with the room..."
            className="flex-1 pl-5 pr-14 py-4 bg-neutral-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 p-2.5 bg-neutral-900 text-white rounded-xl disabled:opacity-50 transition-all active:scale-90 shadow-lg shadow-neutral-900/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
