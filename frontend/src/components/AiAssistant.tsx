'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, Minimize2, Check, X, RotateCcw } from 'lucide-react';

interface ChatMessage {
  role: string;
  text: string;
  action?: any;
  actionState?: 'PENDING' | 'EXECUTED' | 'UNDONE' | 'REJECTED';
}

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Halo! Saya Avario AI. Ada yang bisa saya bantu terkait laporan atau pengubahan data?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          prompt: userMsg.text,
          chatHistory: messages.filter(m => m.role !== 'model' || m.text !== messages[0].text)
        })
      });

      const data = await res.json();
      if (data.response) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: data.response,
          action: data.action,
          actionState: data.action ? 'PENDING' : undefined
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'Maaf, terjadi kesalahan pada server.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Koneksi terputus. Gagal menghubungi AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (msgIndex: number, actionData: any, type: 'execute' | 'undo' | 'reject') => {
    if (type === 'reject') {
      setMessages(prev => {
        const next = [...prev];
        next[msgIndex].actionState = 'REJECTED';
        return next;
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'execute' ? 'execute' : 'undo';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ai/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ actionData })
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages(prev => {
          const next = [...prev];
          next[msgIndex].actionState = type === 'execute' ? 'EXECUTED' : 'UNDONE';
          return next;
        });
      } else {
        alert(data.message || 'Gagal mengeksekusi aksi.');
      }
    } catch (e) {
      alert('Koneksi terputus saat mengeksekusi aksi.');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-110 flex items-center justify-center">
          <MessageCircle size={24} />
        </button>
      ) : (
        <div className="bg-white rounded-xl shadow-2xl w-80 md:w-96 flex flex-col overflow-hidden border border-gray-200 transition-all" style={{ height: '500px' }}>
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-semibold">Avario AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition-colors">
              <Minimize2 size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3 text-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-3 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                
                {/* Action Card */}
                {msg.action && (
                  <div className="w-[90%] bg-white border border-blue-200 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                    <div>
                      <h4 className="font-bold text-gray-800">{msg.action.title}</h4>
                      <p className="text-xs text-gray-600">{msg.action.description}</p>
                    </div>
                    
                    {msg.actionState === 'PENDING' && (
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => handleAction(idx, msg.action, 'execute')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 font-medium transition-colors">
                          <Check size={16} /> Izinkan
                        </button>
                        <button onClick={() => handleAction(idx, msg.action, 'reject')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg flex items-center justify-center gap-1 font-medium transition-colors">
                          <X size={16} /> Tolak
                        </button>
                      </div>
                    )}

                    {msg.actionState === 'EXECUTED' && (
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="bg-green-50 text-green-700 text-xs px-2 py-1.5 rounded flex items-center gap-1">
                          <Check size={14} /> Tindakan Disetujui
                        </div>
                        <button onClick={() => handleAction(idx, msg.action, 'undo')} className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1.5 rounded-lg flex items-center justify-center gap-1 font-medium transition-colors text-xs">
                          <RotateCcw size={14} /> Batalkan (Undo)
                        </button>
                      </div>
                    )}

                    {msg.actionState === 'REJECTED' && (
                      <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1.5 rounded flex items-center gap-1 mt-1">
                        <X size={14} /> Ditolak
                      </div>
                    )}

                    {msg.actionState === 'UNDONE' && (
                      <div className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1.5 rounded flex items-center gap-1 mt-1">
                        <RotateCcw size={14} /> Telah Dibatalkan
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya atau instruksikan..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 text-sm"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-full flex items-center justify-center min-w-[40px] min-h-[40px]"
            >
              <Send size={18} className="ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
