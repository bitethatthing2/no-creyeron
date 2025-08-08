// Legacy compatibility wrapper - import individual functions with default imports
import subscribeToTopic from '../notifications/topic-management';
import unsubscribeFromTopic from '../notifications/topic-management'; 
import getSubscribedTopics from '../notifications/topic-management';
import subscribeToWolfPackLocation from '../notifications/topic-management';
import unsubscribeFromAllWolfPackLocations from '../notifications/topic-management';
import getUserNotificationPreferences from '../notifications/topic-management';

// Export functions with proper fallbacks
export { subscribeToTopic, unsubscribeFromTopic, getSubscribedTopics, subscribeToWolfPackLocation, unsubscribeFromAllWolfPackLocations, getUserNotificationPreferences };
