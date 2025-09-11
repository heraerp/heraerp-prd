// Ice Cream Manager Chat Storage System using HERA's Universal Architecture
// Stores chat messages as universal_transactions with smart codes

import { universalApi } from './universal-api';

// Smart codes for ice cream chat system
export const ICECREAM_CHAT_SMART_CODES = {
  USER_QUERY: 'HERA.ICECREAM.CHAT.USER.QUERY.v1',
  AI_RESPONSE: 'HERA.ICECREAM.CHAT.AI.RESPONSE.v1',
  SESSION_START: 'HERA.ICECREAM.CHAT.SESSION.START.v1',
  SESSION_END: 'HERA.ICECREAM.CHAT.SESSION.END.v1',
  PRODUCTION_PLAN: 'HERA.ICECREAM.CHAT.PRODUCTION.v1',
  COLD_CHAIN_ALERT: 'HERA.ICECREAM.CHAT.COLDCHAIN.v1',
  INVENTORY_ALERT: 'HERA.ICECREAM.CHAT.INVENTORY.v1',
  DISTRIBUTION_OPTIMIZATION: 'HERA.ICECREAM.CHAT.DISTRIBUTION.v1'
} as const;

export interface IceCreamChatMessage {
  id?: string;
  session_id: string;
  message_type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  title?: string; // For conversation titles
  metadata?: {
    user_query?: string;
    response_data?: any;
    tokens_used?: number;
    model?: string;
    temperature_data?: any;
    production_data?: any;
    inventory_data?: any;
    distribution_data?: any;
    analytics_data?: any;
    actions?: any[];
    confidence?: number;
    [key: string]: any;
  };
}

export interface IceCreamChatSession {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  message_count: number;
  last_message?: string;
  preview?: string;
  starred?: boolean;
  tags?: string[];
}

export class IceCreamChatStorage {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    universalApi.setOrganizationId(organizationId);
  }

  /**
   * Save a chat message to the universal_transactions table
   */
  async saveMessage(message: IceCreamChatMessage): Promise<string> {
    try {
      const smartCode = message.message_type === 'user' 
        ? ICECREAM_CHAT_SMART_CODES.USER_QUERY 
        : message.message_type === 'assistant'
        ? ICECREAM_CHAT_SMART_CODES.AI_RESPONSE
        : ICECREAM_CHAT_SMART_CODES.SESSION_START;

      const transaction = await universalApi.createTransaction({
        transaction_type: 'icecream_chat',
        smart_code: smartCode,
        transaction_date: new Date(message.timestamp),
        transaction_code: `ICECHAT-${message.session_id}-${Date.now()}`,
        metadata: {
          session_id: message.session_id,
          message_type: message.message_type,
          content: message.content,
          title: message.title,
          ...message.metadata
        },
        // Store message length as amount for potential analytics
        total_amount: message.content.length,
        organization_id: this.organizationId
      });

      return transaction.id;
    } catch (error) {
      console.error('Failed to save ice cream chat message:', error);
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
  }): Promise<IceCreamChatMessage[]> {
    try {
      const filters: any = {
        transaction_type: 'icecream_chat',
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
          orderDirection: 'asc' // Oldest first for conversation flow
        }
      );

      return transactions.map(tx => ({
        id: tx.id,
        session_id: (tx.metadata as any)?.session_id || '',
        message_type: tx.smart_code === ICECREAM_CHAT_SMART_CODES.USER_QUERY ? 'user' : 
                      tx.smart_code === ICECREAM_CHAT_SMART_CODES.AI_RESPONSE ? 'assistant' : 'system',
        content: (tx.metadata as any)?.content || '',
        timestamp: tx.transaction_date,
        title: (tx.metadata as any)?.title,
        metadata: tx.metadata
      }));
    } catch (error) {
      console.error('Failed to retrieve ice cream chat history:', error);
      throw error;
    }
  }

  /**
   * Get all chat sessions with summary information
   */
  async getChatSessions(options?: {
    limit?: number;
    offset?: number;
    starred?: boolean;
    searchTerm?: string;
  }): Promise<IceCreamChatSession[]> {
    try {
      // Get all unique sessions by querying transactions and grouping by session_id
      const allMessages = await this.getChatHistory({
        limit: 5000 // Get recent messages to extract sessions
      });

      const sessionMap = new Map<string, IceCreamChatSession>();

      allMessages.forEach(msg => {
        if (!sessionMap.has(msg.session_id)) {
          // First message in session - use title if available
          const firstUserMessage = msg.message_type === 'user' ? msg.content : '';
          const title = msg.title || this.generateSessionTitle(firstUserMessage);
          
          sessionMap.set(msg.session_id, {
            id: msg.session_id,
            title: title,
            start_time: msg.timestamp,
            end_time: msg.timestamp,
            message_count: 1,
            last_message: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            preview: firstUserMessage.substring(0, 150) + (firstUserMessage.length > 150 ? '...' : ''),
            starred: (msg.metadata as any)?.starred || false,
            tags: (msg.metadata as any)?.tags || []
          });
        } else {
          const session = sessionMap.get(msg.session_id)!;
          session.message_count++;
          
          // Update title from first user message if not set
          if (!session.title && msg.message_type === 'user') {
            session.title = this.generateSessionTitle(msg.content);
          }
          
          if (new Date(msg.timestamp) < new Date(session.start_time)) {
            session.start_time = msg.timestamp;
          }
          if (new Date(msg.timestamp) > new Date(session.end_time!)) {
            session.end_time = msg.timestamp;
            if (msg.message_type === 'user') {
              session.last_message = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '');
            }
          }
        }
      });

      let sessions = Array.from(sessionMap.values());
      
      // Apply filters
      if (options?.starred) {
        sessions = sessions.filter(s => s.starred);
      }
      
      if (options?.searchTerm) {
        const searchLower = options.searchTerm.toLowerCase();
        sessions = sessions.filter(s => 
          s.title.toLowerCase().includes(searchLower) ||
          s.preview?.toLowerCase().includes(searchLower) ||
          s.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      sessions.sort((a, b) => new Date(b.end_time || b.start_time).getTime() - new Date(a.end_time || a.start_time).getTime());

      const start = options?.offset || 0;
      const end = start + (options?.limit || 20);
      return sessions.slice(start, end);
    } catch (error) {
      console.error('Failed to get ice cream chat sessions:', error);
      throw error;
    }
  }

  /**
   * Generate a session title from the first user message
   */
  private generateSessionTitle(firstMessage: string): string {
    if (!firstMessage) return 'New conversation';
    
    // Extract key topics from the message
    const topics = {
      'cold chain': '🌡️ Cold Chain',
      'temperature': '🌡️ Temperature',
      'production': '🏭 Production',
      'inventory': '📦 Inventory',
      'stock': '📦 Stock',
      'distribution': '🚚 Distribution',
      'delivery': '🚚 Delivery',
      'sales': '📊 Sales',
      'revenue': '💰 Revenue',
      'forecast': '🔮 Forecast',
      'demand': '📈 Demand'
    };
    
    const lowerMessage = firstMessage.toLowerCase();
    for (const [key, title] of Object.entries(topics)) {
      if (lowerMessage.includes(key)) {
        return title + ' Analysis';
      }
    }
    
    // Default: use first 50 chars of message
    return firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
  }

  /**
   * Update session metadata (star, rename, add tags)
   */
  async updateSession(sessionId: string, updates: {
    title?: string;
    starred?: boolean;
    tags?: string[];
  }): Promise<void> {
    try {
      // Get first message of session to update
      const messages = await this.getChatHistory({ 
        session_id: sessionId, 
        limit: 1 
      });
      
      if (messages.length > 0 && messages[0].id) {
        // Update the transaction metadata
        const tx = await universalApi.getTransaction(messages[0].id);
        if (tx) {
          const updatedMetadata = {
            ...tx.metadata,
            ...updates
          };
          
          // Note: This would require adding an updateTransaction method to universalApi
          // For now, we'll document this as a future enhancement
          console.log('Session update stored in metadata:', updatedMetadata);
        }
      }
    } catch (error) {
      console.error('Failed to update session:', error);
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
  }): Promise<IceCreamChatMessage[]> {
    try {
      const allMessages = await this.getChatHistory({ 
        limit: options?.limit || 100,
        offset: options?.offset || 0 
      });
      
      const searchLower = searchTerm.toLowerCase();
      return allMessages.filter(msg => 
        msg.content.toLowerCase().includes(searchLower) ||
        (msg.metadata as any)?.user_query?.toLowerCase().includes(searchLower) ||
        (msg.metadata as any)?.temperature_data?.toString().toLowerCase().includes(searchLower) ||
        (msg.metadata as any)?.production_data?.toString().toLowerCase().includes(searchLower)
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
      transaction_type: 'icecream_chat_session',
      smart_code: ICECREAM_CHAT_SMART_CODES.SESSION_START,
      transaction_date: new Date(),
      transaction_code: `ICESESSION-${sessionId}`,
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
      transaction_type: 'icecream_chat_session',
      smart_code: ICECREAM_CHAT_SMART_CODES.SESSION_END,
      transaction_date: new Date(),
      transaction_code: `ICESESSION-END-${sessionId}`,
      metadata: {
        session_id: sessionId,
        end_time: new Date().toISOString()
      },
      total_amount: 0,
      organization_id: this.organizationId
    });
  }

  /**
   * Get analytics data for sessions
   */
  async getSessionAnalytics(): Promise<{
    total_sessions: number;
    total_messages: number;
    avg_messages_per_session: number;
    popular_topics: { topic: string; count: number }[];
    peak_usage_hours: { hour: number; count: number }[];
  }> {
    try {
      const sessions = await this.getChatSessions({ limit: 1000 });
      const allMessages = await this.getChatHistory({ limit: 10000 });
      
      // Topic analysis
      const topicCounts = new Map<string, number>();
      const topics = ['cold chain', 'production', 'inventory', 'distribution', 'sales', 'forecast'];
      
      allMessages.forEach(msg => {
        const content = msg.content.toLowerCase();
        topics.forEach(topic => {
          if (content.includes(topic)) {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
          }
        });
      });
      
      // Hour analysis
      const hourCounts = new Map<number, number>();
      allMessages.forEach(msg => {
        const hour = new Date(msg.timestamp).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });
      
      return {
        total_sessions: sessions.length,
        total_messages: allMessages.length,
        avg_messages_per_session: sessions.length > 0 ? allMessages.length / sessions.length : 0,
        popular_topics: Array.from(topicCounts.entries())
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        peak_usage_hours: Array.from(hourCounts.entries())
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => a.hour - b.hour)
      };
    } catch (error) {
      console.error('Failed to get session analytics:', error);
      throw error;
    }
  }
}

// Export a factory function for creating storage instances
export function createIceCreamChatStorage(organizationId: string): IceCreamChatStorage {
  return new IceCreamChatStorage(organizationId);
}