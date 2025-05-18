import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const API_URL = "http://10.37.107.140:5000/api"; // 🔁 Replace with your local network IP

// Types
export interface Person {
  id: string;
  name: string;
  joinedAt: string;
  contactInfo?: string;
}

export interface Queue {
  id: string;
  name: string;
  createdAt: string;
  description?: string;
  location?: string;
  timePerPerson?: number;
  isActive: boolean;
  people: Person[];
}

interface QueueContextType {
  activeHostQueue: Queue | null;
  currentQueue: Queue | null;
  userName: string | null;
  userPosition: number | null;
  createQueue: (queueData: Partial<Queue>) => Promise<Queue>;
  joinQueue: (queueId: string, name: string, contactInfo?: string) => Promise<boolean>;
  callNext: (queueId: string) => Promise<Person | null>;
  removePerson: (queueId: string, personId: string) => Promise<void>;
  leaveQueue: (queueId: string, personId: string) => Promise<void>;
  endQueue: (queueId: string) => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Hook
export const useQueueContext = () => {
  const context = useContext(QueueContext);
  if (!context) throw new Error("useQueueContext must be used within a QueueProvider");
  return context;
};

// Provider
export const QueueProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [activeHostQueue, setActiveHostQueue] = useState<Queue | null>(null);
  const [currentQueue, setCurrentQueue] = useState<Queue | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<number | null>(null);

  const createQueue = async (queueData: Partial<Queue>): Promise<Queue> => {
    const res = await axios.post(`${API_URL}/create_queue`, queueData);
    setActiveHostQueue(res.data);
    return res.data;
  };

  const joinQueue = async (queueId: string, name: string, contactInfo?: string): Promise<boolean> => {
    try {
      const res = await axios.post(`${API_URL}/join_queue`, { queueId, name, contactInfo });
      if (res.data.success) {
        const updatedQueue = await getQueue(queueId);
        setCurrentQueue(updatedQueue);
        setUserName(name);
        const position = updatedQueue.people.findIndex(p => p.name === name) + 1;
        setUserPosition(position);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const getQueue = async (queueId: string): Promise<Queue> => {
    const res = await axios.get(`${API_URL}/get_queue/${queueId}`);
    return res.data;
  };

  const callNext = async (queueId: string): Promise<Person | null> => {
    try {
      const res = await axios.post(`${API_URL}/call_next/${queueId}`);
      return res.data;
    } catch {
      return null;
    }
  };

  const removePerson = async (queueId: string, personId: string): Promise<void> => {
    await axios.post(`${API_URL}/remove_person`, { queueId, personId });
    const updatedQueue = await getQueue(queueId);
    setActiveHostQueue(updatedQueue);
  };

  const leaveQueue = async (queueId: string, personId: string): Promise<void> => {
    await removePerson(queueId, personId);
    setCurrentQueue(null);
    setUserName(null);
    setUserPosition(null);
  };

  const endQueue = async (queueId: string): Promise<void> => {
    await axios.post(`${API_URL}/end_queue/${queueId}`);
    setActiveHostQueue(null);
  };

  return (
    <QueueContext.Provider
      value={{
        activeHostQueue,
        currentQueue,
        userName,
        userPosition,
        createQueue,
        joinQueue,
        callNext,
        removePerson,
        leaveQueue,
        endQueue
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};
