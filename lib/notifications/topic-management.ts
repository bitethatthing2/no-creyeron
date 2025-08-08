import { supabase } from '@/lib/supabase';
import type { Json, Database } from '@/types/database.types';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Type aliases using the Database schema
export type NotificationTopic = Database['public']['Tables']['notification_topics']['Row'];
export type NotificationTopicInsert = Database['public']['Tables']['notification_topics']['Insert'];
export type NotificationTopicUpdate = Database['public']['Tables']['notification_topics']['Update'];

export type TopicSubscription = Database['public']['Tables']['topic_subscriptions']['Row'];
export type TopicSubscriptionInsert = Database['public']['Tables']['topic_subscriptions']['Insert'];
export type TopicSubscriptionUpdate = Database['public']['Tables']['topic_subscriptions']['Update'];

// Topic management class
export class TopicManagement {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  // Notification Topics Management
  async getAllTopics(): Promise<NotificationTopic[]> {
    const { data, error } = await this.supabase
      .from('notification_topics')
      .select('*')
      .order('display_name');

    if (error) throw error;
    return data || [];
  }

  async getActiveTopics(): Promise<NotificationTopic[]> {
    const { data, error } = await this.supabase
      .from('notification_topics')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;
    return data || [];
  }

  async getTopicByKey(topicKey: string): Promise<NotificationTopic | null> {
    const { data, error } = await this.supabase
      .from('notification_topics')
      .select('*')
      .eq('topic_key', topicKey)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async createTopic(topic: NotificationTopicInsert): Promise<NotificationTopic> {
    const { data, error } = await this.supabase
      .from('notification_topics')
      .insert(topic)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTopic(id: string, updates: NotificationTopicUpdate): Promise<NotificationTopic> {
    const { data, error } = await this.supabase
      .from('notification_topics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTopic(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notification_topics')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deactivateTopic(id: string): Promise<NotificationTopic> {
    return this.updateTopic(id, { is_active: false });
  }

  async activateTopic(id: string): Promise<NotificationTopic> {
    return this.updateTopic(id, { is_active: true });
  }

  // Topic Subscriptions Management
  async getAllSubscriptions(): Promise<TopicSubscription[]> {
    const { data, error } = await this.supabase
      .from('topic_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSubscriptionsByTopic(topic: string): Promise<TopicSubscription[]> {
    const { data, error } = await this.supabase
      .from('topic_subscriptions')
      .select('*')
      .eq('topic', topic)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSubscriptionsByUser(userId: string): Promise<TopicSubscription[]> {
    const { data, error } = await this.supabase
      .from('topic_subscriptions')
      .select('*')
      .eq('id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSubscriptionsByToken(token: string): Promise<TopicSubscription[]> {
    const { data, error } = await this.supabase
      .from('topic_subscriptions')
      .select('*')
      .eq('token', token)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createSubscription(subscription: TopicSubscriptionInsert): Promise<TopicSubscription> {
    const { data, error } = await this.supabase
      .from('topic_subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSubscription(id: string, updates: TopicSubscriptionUpdate): Promise<TopicSubscription> {
    const { data, error } = await this.supabase
      .from('topic_subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSubscription(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('topic_subscriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteSubscriptionByTokenAndTopic(token: string, topic: string): Promise<void> {
    const { error } = await this.supabase
      .from('topic_subscriptions')
      .delete()
      .eq('token', token)
      .eq('topic', topic);

    if (error) throw error;
  }

  // Bulk operations
  async subscribeTokenToTopics(token: string, topics: string[], userId?: string): Promise<TopicSubscription[]> {
    const subscriptions: TopicSubscriptionInsert[] = topics.map(topic => ({
      token,
      topic,
      id: userId || null
    }));

    const { data, error } = await this.supabase
      .from('topic_subscriptions')
      .insert(subscriptions)
      .select();

    if (error) throw error;
    return data || [];
  }

  async unsubscribeTokenFromTopics(token: string, topics: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('topic_subscriptions')
      .delete()
      .eq('token', token)
      .in('topic', topics);

    if (error) throw error;
  }

  async unsubscribeTokenFromAllTopics(token: string): Promise<void> {
    const { error } = await this.supabase
      .from('topic_subscriptions')
      .delete()
      .eq('token', token);

    if (error) throw error;
  }

  // User-specific operations
  async subscribeUserToTopic(userId: string, topic: string, token: string): Promise<TopicSubscription> {
    return this.createSubscription({
      id: userId,
      topic,
      token
    });
  }

  async unsubscribeUserFromTopic(userId: string, topic: string): Promise<void> {
    const { error } = await this.supabase
      .from('topic_subscriptions')
      .delete()
      .eq('id', userId)
      .eq('topic', topic);

    if (error) throw error;
  }

  async getUserTopics(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('topic_subscriptions')
      .select('topic')
      .eq('id', userId);

    if (error) throw error;
    return data?.map(sub => sub.topic) || [];
  }

  // Analytics and reporting
  async getTopicSubscriptionCounts(): Promise<Array<{ topic: string; count: number }>> {
    const { data, error } = await this.supabase
      .from('topic_subscriptions')
      .select('topic')
      .order('topic');

    if (error) throw error;
    
    // Count subscriptions per topic
    const counts = data?.reduce((acc, sub) => {
      acc[sub.topic] = (acc[sub.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return Object.entries(counts).map(([topic, count]) => ({ topic, count }));
  }

  async getActiveTopicsWithSubscriptionCounts(): Promise<Array<NotificationTopic & { subscription_count: number }>> {
    // Get active topics
    const topics = await this.getActiveTopics();
    
    // Get subscription counts
    const counts = await this.getTopicSubscriptionCounts();
    const countMap = new Map(counts.map(c => [c.topic, c.count]));

    // Combine data
    return topics.map(topic => ({
      ...topic,
      subscription_count: countMap.get(topic.topic_key) || 0
    }));
  }

  // Cleanup operations
  async cleanupInactiveSubscriptions(): Promise<number> {
    // This would typically involve checking for expired or invalid tokens
    // For now, we'll just remove subscriptions for inactive topics
    const { data: inactiveTopics } = await this.supabase
      .from('notification_topics')
      .select('topic_key')
      .eq('is_active', false);

    if (!inactiveTopics || inactiveTopics.length === 0) {
      return 0;
    }

    const inactiveTopicKeys = inactiveTopics.map(t => t.topic_key);
    
    const { count, error } = await this.supabase
      .from('topic_subscriptions')
      .delete()
      .in('topic', inactiveTopicKeys);

    if (error) throw error;
    return count || 0;
  }
}

// Export singleton instance factory
export function createTopicManagement(supabaseUrl: string, supabaseKey: string): TopicManagement {
  return new TopicManagement(supabaseUrl, supabaseKey);
}

// Export default instance if environment variables are available
export default typeof process !== 'undefined' && process.env 
  ? createTopicManagement(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
  : null;