import { useState, useEffect, useRef } from 'react';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, limit, handleFirestoreError, OperationType } from '../firebase';
import { Send, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export function ChatWindow({ currentUser, targetUser, onClose }: { currentUser: any, targetUser: any, onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationId = [currentUser.uid, targetUser.uid].sort().join('_');

  useEffect(() => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef, 
      orderBy('createdAt', 'desc'), // Use desc to get the latest messages
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Since we used 'desc' to get the latest, we need to reverse the list for display
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs.reverse());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `conversations/${conversationId}/messages`);
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
      try {
        await setDoc(convRef, {
          participants: [currentUser.uid, targetUser.uid],
          lastMessage: text,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `conversations/${conversationId}`);
        return;
      }

      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      try {
        await addDoc(messagesRef, {
          text,
          senderId: currentUser.uid,
          createdAt: serverTimestamp(),
          conversationId
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `conversations/${conversationId}/messages`);
      }
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/30">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.uid;
            const prevMsg = messages[idx - 1];
            const nextMsg = messages[idx + 1];
            
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
            const showTime = !prevMsg || (msg.createdAt?.seconds - prevMsg.createdAt?.seconds > 600);
            
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showTime && msg.createdAt && (
                  <div className="w-full flex justify-center my-6">
                    <span className="px-3 py-1 bg-neutral-200/50 text-neutral-500 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full">
                      {format(msg.createdAt.toDate(), 'EEEE, p')}
                    </span>
                  </div>
                )}
                
                <div className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={cn(
                      "px-4 py-3 text-sm leading-relaxed shadow-sm transition-all",
                      isMe 
                        ? "bg-neutral-900 text-white" 
                        : "bg-white text-neutral-900 border border-neutral-100",
                      isFirstInGroup && isMe && "rounded-2xl rounded-tr-none",
                      isFirstInGroup && !isMe && "rounded-2xl rounded-tl-none",
                      !isFirstInGroup && isMe && "rounded-2xl rounded-tr-none rounded-br-none",
                      !isFirstInGroup && !isMe && "rounded-2xl rounded-tl-none rounded-bl-none",
                      isLastInGroup && isMe && "rounded-br-2xl",
                      isLastInGroup && !isMe && "rounded-bl-2xl",
                      !isFirstInGroup && !isLastInGroup && "rounded-2xl"
                    )}
                  >
                    {msg.text}
                  </motion.div>
                  
                  {isLastInGroup && msg.createdAt && (
                    <span className={cn(
                      "text-[9px] text-neutral-400 mt-1 font-medium",
                      isMe ? "mr-1" : "ml-1"
                    )}>
                      {format(msg.createdAt.toDate(), 'p')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={scrollRef} className="h-2" />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-neutral-100">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 px-5 py-4 bg-neutral-100 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-4 bg-neutral-900 text-white rounded-full disabled:opacity-20 disabled:grayscale transition-all active:scale-90 shadow-lg shadow-neutral-900/10"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
