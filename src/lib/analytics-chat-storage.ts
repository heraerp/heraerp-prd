// Analytics Chat Storage System using HERA's Universal Architecture
// Stores chat messages as universal_transactions with smart codes

import { universalApi } from './universal-api';

// Smart codes for analytics chat system
export const CHAT_SMART_CODES = {
  USER_QUERY: 'HERA.ANALYTICS.CHAT.USER.QUERY.v1',
  AI_RESPONSE: 'HERA.ANALYTICS.CHAT.AI.RESPONSE.v1',
  SESSION_START: 'HERA.ANALYTICS.CHAT.SESSION.START.v1',
  SESSION_END: 'HERA.ANALYTICS.CHAT.SESSION.END.v1'
} as const;

export interface ChatMessage {
  id?: string;
  session_id: string;
  message_type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    user_query?: string;
    response_data?: any;
    tokens_used?: number;
    model?: string;
    [key: string]: any;
  };
}

export interface ChatSession {
  id: string;
  start_time: string;
  end_time?: string;
  message_count: number;
  last_message?: string;
}

export class AnalyticsChatStorage {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    universalApi.setOrganizationId(organizationId);
  }

  /**
   * Save a chat message to the universal_transactions table
   */
  async saveMessage(message: ChatMessage): Promise<string> {
    try {
      const smartCode = message.message_type === 'user' 
        ? CHAT_SMART_CODES.USER_QUERY 
        : CHAT_SMART_CODES.AI_RESPONSE;

      const transaction = await universalApi.createTransaction({
        transaction_type: 'analytics_chat',
        smart_code: smartCode,
        transaction_date: new Date(message.timestamp),
        transaction_code: `CHAT-${message.session_id}-${Date.now()}`,
        metadata: {
          session_id: message.session_id,
          message_type: message.message_type,
          content: message.content,
          ...message.metadata
        },
        // Store message length as amount for potential analytics
        total_amount: message.content.length,
        organization_id: this.organizationId
      });

      return transaction.id;
    } catch (error) {
      console.error('Failed to save chat message:', error);
      throw error;
    }
  }

  /**
   * Retrieve chat history for the organization
   */
  async getChatHistory(options?: {
    session_id?: string;
    limit?: number;
    offset?: number;
    start_date?: Date;
    end_date?: Date;
  }): Promise<ChatMessage[]> {
    try {
      const filters: any = {
        transaction_type: 'analytics_chat',
        organization_id: this.organizationId
      };

      if (options?.session_id) {
        filters["metadata->session_id"] = options.session_id;
      }

      const transactions = await universalApi.searchTransactions(
        filters,
        { 
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          orderBy: 'transaction_date',
          orderDirection: 'desc'
        }
      );

      return transactions.map(tx => ({
        id: tx.id,
        session_id: (tx.metadata as any)?.session_id || '',
        message_type: tx.smart_code === CHAT_SMART_CODES.USER_QUERY ? 'user' : 'assistant',
        content: (tx.metadata as any)?.content || '',
        timestamp: tx.transaction_date,
        metadata: tx.metadata
      }));
    } catch (error) {
      console.error('Failed to retrieve chat history:', error);
      throw error;
    }
  }

  /**
   * Get all chat sessions with summary information
   */
  async getChatSessions(options?: {
    limit?: number;
    offset?: number;
  }): Promise<ChatSession[]> {
    try {
      // Get all unique sessions by querying transactions and grouping by session_id
      const allMessages = await this.getChatHistory({
        limit: 1000 // Get recent messages to extract sessions
      });

      const sessionMap = new Map<string, ChatSession>();

      allMessages.forEach(msg => {
        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, {
            id: msg.session_id,
            start_time: msg.timestamp,
            end_time: msg.timestamp,
            message_count: 1,
            last_message: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
          });
        } else {
          const session = sessionMap.get(msg.session_id)!;
          session.message_count++;
          if (new Date(msg.timestamp) < new Date(session.start_time)) {
            session.start_time = msg.timestamp;
          }
          if (new Date(msg.timestamp) > new Date(session.end_time!)) {
            session.end_time = msg.timestamp;
            session.last_message = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '');
          }
        }
      });

      const sessions = Array.from(sessionMap.values());
      sessions.sort((a, b) => new Date(b.end_time || b.start_time).getTime() - new Date(a.end_time || a.start_time).getTime());

      const start = options?.offset || 0;
      const end = start + (options?.limit || 20);
      return sessions.slice(start, end);
    } catch (error) {
      console.error('Failed to get chat sessions:', error);
      throw error;
    }
  }

  /**
   * Delete a specific chat message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await universalApi.deleteTransaction(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Delete all messages in a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const messages = await this.getChatHistory({ session_id: sessionId });
      
      // Delete all messages in the session
      await Promise.all(
        messages.map(msg => msg.id ? this.deleteMessage(msg.id) : Promise.resolve())
      );
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * Clear all chat history for the organization
   */
  async clearAllHistory(): Promise<void> {
    try {
      const allMessages = await this.getChatHistory({ limit: 10000 });
      
      await Promise.all(
        allMessages.map(msg => msg.id ? this.deleteMessage(msg.id) : Promise.resolve())
      );
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      throw error;
    }
  }

  /**
   * Search chat history by content
   */
  async searchChatHistory(searchTerm: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<ChatMessage[]> {
    try {
      const allMessages = await this.getChatHistory({ 
        limit: options?.limit || 100,
        offset: options?.offset || 0 
      });
      
      const searchLower = searchTerm.toLowerCase();
      return allMessages.filter(msg => 
        msg.content.toLowerCase().includes(searchLower) ||
        (msg.metadata as any)?.user_query?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Failed to search chat history:', error);
      throw error;
    }
  }

  /**
   * Start a new chat session
   */
  async startSession(): Promise<string> {
    const sessionId = crypto.randomUUID();
    
    await universalApi.createTransaction({
      transaction_type: 'analytics_chat_session',
      smart_code: CHAT_SMART_CODES.SESSION_START,
      transaction_date: new Date(),
      transaction_code: `SESSION-${sessionId}`,
      metadata: {
        session_id: sessionId,
        start_time: new Date().toISOString()
      },
      total_amount: 0,
      organization_id: this.organizationId
    });

    return sessionId;
  }

  /**
   * End a chat session
   */
  async endSession(sessionId: string): Promise<void> {
    await universalApi.createTransaction({
      transaction_type: 'analytics_chat_session',
      smart_code: CHAT_SMART_CODES.SESSION_END,
      transaction_date: new Date(),
      transaction_code: `SESSION-END-${sessionId}`,
      metadata: {
        session_id: sessionId,
        end_time: new Date().toISOString()
      },
      total_amount: 0,
      organization_id: this.organizationId
    });
  }
}

// Export a factory function for creating storage instances
export function createAnalyticsChatStorage(organizationId: string): AnalyticsChatStorage {
  return new AnalyticsChatStorage(organizationId);
}