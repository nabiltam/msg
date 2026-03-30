import { useState, useEffect, useRef } from 'react';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from '../firebase';
import { Send, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export function ChatWindow({ currentUser, targetUser, onClose }: { currentUser: any, targetUser: any, onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationId = [currentUser.uid, targetUser.uid].sort().join('_');

  useEffect(() => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const convRef = doc(db, 'conversations', conversationId);
      await setDoc(convRef, {
        participants: [currentUser.uid, targetUser.uid],
        lastMessage: text,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        text,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
        conversationId
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed inset-0 z-50 md:inset-auto md:right-8 md:bottom-8 md:w-[400px] md:h-[600px] bg-white shadow-2xl md:rounded-3xl flex flex-col overflow-hidden border border-neutral-100"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50 backdrop-blur-sm">
        <div className="relative">
          <img src={targetUser.photoURL} alt="" className="w-10 h-10 rounded-full border border-neutral-200" referrerPolicy="no-referrer" />
          <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
            <div className={`w-2 h-2 rounded-full ${targetUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900 truncate">{targetUser.displayName}</h3>
          <div className="flex items-center gap-1 text-[10px] text-neutral-400 uppercase tracking-tighter font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>Encrypted Pulse</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/20">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.uid;
            const showTime = idx === 0 || (msg.createdAt?.seconds - messages[idx-1].createdAt?.seconds > 300);
            
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showTime && msg.createdAt && (
                  <span className="text-[9px] text-neutral-400 uppercase tracking-widest mb-2 mt-4 self-center">
                    {format(msg.createdAt.toDate(), 'p')}
                  </span>
                )}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: isMe ? 10 : -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-neutral-900 text-white rounded-tr-none' 
                      : 'bg-white text-neutral-900 border border-neutral-100 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-neutral-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full pl-4 pr-12 py-3 bg-neutral-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 p-2 bg-neutral-900 text-white rounded-xl disabled:opacity-50 disabled:bg-neutral-400 transition-all active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
