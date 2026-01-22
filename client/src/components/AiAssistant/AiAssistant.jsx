import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, X, Minimize2, Maximize2, Loader2, MessageSquare } from 'lucide-react';
import { analyzeIntent } from "./aiLogic";

const AiAssistant = () => {
  const navigate = useNavigate();
  
  // États de l'interface
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mémoire contextuelle 
  const [aiContext, setAiContext] = useState(null);

  // Historique des messages
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Bonjour ! 👋 Je suis l'assistant V.A. Je peux vous aider à naviguer, chercher des clients ou répondre à vos questions.`
    }
  ]);
  
  const messagesEndRef = useRef(null);

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  // Gestion de l'envoi
  const handleSend = async (e, manualInput = null) => {
    if (e) e.preventDefault();
    const textToSend = manualInput || input;
    
    if (!textToSend.trim()) return;

    // Ajouter le message utilisateur
    setMessages((prev) => [...prev, { role: 'user', content: textToSend }]);
    setInput('');
    setIsLoading(true);

    try {
      // Appel à la logique (avec le contexte actuel pour la mémoire)
      const response = await analyzeIntent(textToSend, aiContext); 

      // Simulation d'un petit délai "humain"
      if (!response.action) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Ajouter la réponse de l'IA
      setMessages((prev) => [...prev, { role: 'assistant', content: response.text }]);

      // Gestion des actions (navigation et contexte)
      if (response.action) {
        setTimeout(() => {
          navigate(response.action);
        }, 1000);
        setAiContext(null); // Action terminée, on vide la mémoire
      } else if (response.context) {
        setAiContext(response.context);
      } else {
        setAiContext(null);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Oups, une erreur technique est survenue." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[#3F3F3F] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title="Ouvrir l'assistant"
      >
        <MessageSquare className="w-6 h-6 group-hover:hidden" />
        <Bot className="w-6 h-6 hidden group-hover:block" />
      </button>
    );
  }

  return (
    <div className={`fixed z-50 right-6 bottom-6 flex flex-col font-inter transition-all duration-300 ${isMinimized ? 'w-72' : 'w-80 md:w-96'}`}>
      
      <div className={`bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden ${isMinimized ? 'h-14' : 'h-[500px] max-h-[80vh]'}`}>
        
        <div 
          className="bg-[#3F3F3F] text-white p-3 flex justify-between items-center cursor-pointer" 
          onClick={() => !isMinimized && setIsMinimized(true)}
        >
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="font-semibold text-sm">Assistant V.A.</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} 
              className="hover:bg-white/20 p-1 rounded transition"
              title={isMinimized ? "Agrandir" : "Réduire"}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
              className="hover:bg-red-500 p-1 rounded transition"
              title="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-[#3F3F3F] text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 rounded-bl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#3F3F3F]" />
                    <span className="text-xs text-gray-500">Je réfléchis...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length < 3 && (
              <div className="px-4 py-2 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-100">
                {["Factures impayées", "Comment créer un contact", "Aller au calendrier", "Aide"].map((s, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => handleSend(e, s)}
                    className="whitespace-nowrap text-xs bg-white border border-gray-300 px-3 py-1 rounded-full text-gray-600 hover:bg-[#3F3F3F] hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Posez une question..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F3F3F] text-[#3F3F3F]"
                disabled={isLoading}
                autoFocus
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading} 
                className="bg-[#3F3F3F] text-white p-2 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;