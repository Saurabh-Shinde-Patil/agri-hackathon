import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Mic, Send, Bot, User, Settings, Volume2, VolumeX, MicOff } from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function FloatingChatbot() {
  const { activeFarmId } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'नमस्कार! Hello! I am your AI farming assistant. Ask me anything about your crops or hardware.', type: 'general' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [aiProvider, setAiProvider] = useState('gemini');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Init Speech Recognition (Webkit)
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Multi-lingual dictation generally adapts well

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
           setInputVal(prev => prev + ' ' + finalTranscript);
        }
      };

      recognition.onerror = (e) => {
        console.error('Speech recognition error', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInputVal(''); // clear input when starting new dictation
      recognitionRef.current?.start();
    }
  };

  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Auto-detection: native browser API handles language switching pretty well based on characters
    utterance.rate = 0.9; 
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMessage = inputVal.trim();
    setInputVal('');
    
    // Stop listening if user hits send manually
    if (isListening) recognitionRef.current?.stop();

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/chat', {
        message: userMessage,
        provider: aiProvider,
        farm_id: activeFarmId
      });

      const aiReply = response.data.reply || 'Sorry, I could not understand that.';
      const aiType = response.data.type || 'general';

      setMessages(prev => [...prev, { role: 'assistant', content: aiReply, type: aiType }]);
      
      // Auto Play audio
      speakText(aiReply);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection to the AI Assistant failed.', type: 'error' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ── FAB ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-primary-color to-accent-color rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group hover:shadow-primary-color/40"
      >
        {isOpen ? <X size={26} className="text-white" /> : <MessageSquare size={26} className="text-white group-hover:animate-pulse" />}
      </button>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] md:w-[420px] max-h-[600px] h-[75vh] bg-[#1a2332] border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in-up">
          
          {/* Header */}
          <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-color/20 flex items-center justify-center">
                <Bot size={22} className="text-primary-color" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-wide">Agri Assistant</h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMuted(!isMuted)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-secondary hover:text-white transition">
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </div>

          {/* Provider Selector */}
          <div className="px-4 py-2 bg-black/20 border-b border-white/5 flex items-center gap-2">
            <Settings size={12} className="text-text-secondary" />
            <select 
              value={aiProvider} 
              onChange={(e) => setAiProvider(e.target.value)}
              className="bg-transparent text-xs text-text-secondary font-bold uppercase tracking-widest outline-none py-1 cursor-pointer w-full"
            >
              <option value="gemini">Google Gemini AI</option>
              <option value="grok">xAI Grok-2</option>
              <option value="together">Together AI (Llama)</option>
            </select>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary-color text-white rounded-tr-sm shadow-md' 
                    : 'bg-white/10 text-white/90 rounded-tl-sm border border-white/5'
                }`}>
                  {msg.role === 'assistant' && msg.type !== 'general' && msg.type !== 'error' && (
                    <span className="block text-[9px] uppercase tracking-widest text-primary-color/70 mb-1 font-bold">
                       {msg.type} Module
                    </span>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-text-secondary animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-text-secondary animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-text-secondary animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-black/20 border-t border-white/10">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={toggleListen}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/30' : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'}`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input 
                type="text" 
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask your farm assistant..."}
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-primary-color/50 transition-all font-medium"
              />
              <button 
                type="submit"
                disabled={!inputVal.trim() && !isListening}
                className="w-10 h-10 rounded-full bg-primary-color text-white flex items-center justify-center hover:bg-primary-color/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
