import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseChatHistoryProps {
  avatarId: string;
  welcomeMessage?: string;
}

export function useChatHistory({ avatarId, welcomeMessage }: UseChatHistoryProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Load chat history from database
  useEffect(() => {
    if (!userId || !avatarId) {
      setIsLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .eq('avatar_id', avatarId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedMessages: Message[] = data.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(loadedMessages);
        } else if (welcomeMessage) {
          // No history, show welcome message
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: welcomeMessage,
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        if (welcomeMessage) {
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: welcomeMessage,
            timestamp: new Date(),
          }]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [userId, avatarId, welcomeMessage]);

  // Save message to database
  const saveMessage = useCallback(async (role: "user" | "assistant", content: string): Promise<string | null> => {
    if (!userId || !avatarId) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          avatar_id: avatarId,
          role,
          content,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }, [userId, avatarId]);

  // Add message to local state and save to DB
  const addMessage = useCallback(async (role: "user" | "assistant", content: string): Promise<Message> => {
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      role,
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Save to database in background
    saveMessage(role, content).then((dbId) => {
      if (dbId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: dbId } : m))
        );
      }
    });

    return newMessage;
  }, [saveMessage]);

  // Update the last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && prev[lastIndex].role === "assistant" && prev[lastIndex].id !== "welcome") {
        return prev.map((m, i) =>
          i === lastIndex ? { ...m, content } : m
        );
      }
      return prev;
    });
  }, []);

  // Save the final assistant message after streaming completes
  const saveAssistantMessage = useCallback(async (content: string) => {
    await saveMessage("assistant", content);
  }, [saveMessage]);

  // Clear chat history
  const clearHistory = useCallback(async () => {
    if (!userId || !avatarId) return;

    try {
      await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId)
        .eq('avatar_id', avatarId);

      if (welcomeMessage) {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date(),
        }]);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, [userId, avatarId, welcomeMessage]);

  // Get messages for API (exclude welcome message)
  const getMessagesForAPI = useCallback(() => {
    return messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  return {
    messages,
    setMessages,
    isLoading,
    addMessage,
    updateLastAssistantMessage,
    saveAssistantMessage,
    clearHistory,
    getMessagesForAPI,
  };
}
