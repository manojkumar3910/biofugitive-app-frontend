import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVITY_STORAGE_KEY = '@recent_activities';
const MAX_ACTIVITIES = 20;

// Activity types with their display info
export const ACTIVITY_TYPES = {
  SCAN_SUCCESS: {
    type: 'scan_success',
    message: 'Fingerprint scanned successfully',
    color: 'success',
  },
  SCAN_FAILED: {
    type: 'scan_failed',
    message: 'Scan failed - Please retry',
    color: 'danger',
  },
  MATCH_FOUND: {
    type: 'match_found',
    message: 'Match found in database',
    color: 'success',
  },
  NO_MATCH: {
    type: 'no_match',
    message: 'No match found',
    color: 'warning',
  },
  DOCUMENT_VIEWED: {
    type: 'document_viewed',
    message: 'Person record viewed',
    color: 'primary',
  },
  LOGIN: {
    type: 'login',
    message: 'Logged in successfully',
    color: 'success',
  },
  LOGOUT: {
    type: 'logout',
    message: 'Logged out',
    color: 'warning',
  },
  FORENSIC_ANALYSIS: {
    type: 'forensic_analysis',
    message: 'Forensic analysis started',
    color: 'info',
  },
  CAMERA_ACCESS: {
    type: 'camera_access',
    message: 'Camera accessed for scanning',
    color: 'primary',
  },
  SEARCH_PERFORMED: {
    type: 'search_performed',
    message: 'Search performed',
    color: 'info',
  },
};

const ActivityContext = createContext({
  activities: [],
  addActivity: () => {},
  clearActivities: () => {},
  refreshActivities: () => {},
});

export const useActivity = () => useContext(ActivityContext);

export function ActivityProvider({ children }) {
  const [activities, setActivities] = useState([]);

  // Load activities from storage on mount
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const stored = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActivities(parsed);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const saveActivities = async (newActivities) => {
    try {
      await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(newActivities));
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  };

  const addActivity = useCallback(async (activityType, details = {}) => {
    const activityInfo = ACTIVITY_TYPES[activityType] || {
      type: activityType,
      message: details.message || 'Activity recorded',
      color: 'primary',
    };

    const newActivity = {
      id: Date.now().toString(),
      type: activityInfo.type,
      message: details.message || activityInfo.message,
      color: activityInfo.color,
      timestamp: new Date().toISOString(),
      details: details,
    };

    setActivities(prev => {
      const updated = [newActivity, ...prev].slice(0, MAX_ACTIVITIES);
      saveActivities(updated);
      return updated;
    });
  }, []);

  const clearActivities = useCallback(async () => {
    setActivities([]);
    await AsyncStorage.removeItem(ACTIVITY_STORAGE_KEY);
  }, []);

  const refreshActivities = useCallback(() => {
    loadActivities();
  }, []);

  return (
    <ActivityContext.Provider value={{ 
      activities, 
      addActivity, 
      clearActivities,
      refreshActivities,
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

// Helper function to format time ago
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return time.toLocaleDateString();
};
