import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Paperclip, Search } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Auth } from './components/Auth';
import { Message } from './types';
import { supabase } from './lib/supabase';
import { getChatCompletion } from './lib/openai';
import toast from 'react-hot-toast';

function App() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      loadMessages();
    }
  }, [session]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } else {
      setMessages(data || []);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!session?.user) return;

    setIsLoading(true);

    try {
      const { error: userMessageError } = await supabase.from('messages').insert([
        {
          content,
          role: 'user',
          user_id: session.user.id,
        },
      ]);

      if (userMessageError) throw userMessageError;

      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const aiResponse = await getChatCompletion([...chatHistory, { role: 'user', content }]);

      const { error: aiMessageError } = await supabase.from('messages').insert([
        {
          content: aiResponse,
          role: 'assistant',
          user_id: session.user.id,
        },
      ]);

      if (aiMessageError) throw aiMessageError;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error in chat interaction:', error);
      toast.error(error.message || 'Une erreur est survenue lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <Auth />
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-gray-100">
      <div className="h-screen flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#2A2A2A] p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-semibold">WA Assistant IA</h1>
          </div>
          
          <button
            className="flex items-center gap-2 w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Nouvelle conversation
          </button>

          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-400 mb-2">Conversations récentes</h2>
            <div className="space-y-1">
              {/* Liste des conversations (à implémenter) */}
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-2">Bienvenue sur WA Assistant IA</h2>
                <p className="text-gray-400">Comment puis-je vous aider aujourd'hui ?</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
          </div>

          {/* Input Container */}
          <div className="border-t border-gray-700 p-4">
            <div className="max-w-4xl mx-auto">
              <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;