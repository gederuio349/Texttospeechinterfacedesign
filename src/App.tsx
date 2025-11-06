import { useState } from "react";
import { IdentificationScreen } from "./components/IdentificationScreen";
import { MainRecordScreen } from "./components/MainRecordScreen";
import { MessagesScreen } from "./components/MessagesScreen";
import { Toaster } from "./components/ui/sonner";

interface Message {
  id: string;
  userName: string;
  audioUrl: string;
  duration: string;
  timestamp: string;
  text: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'identification' | 'record' | 'messages'>('identification');
  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const handleIdentificationComplete = (name: string) => {
    setUserName(name);
    setCurrentScreen('record');
  };

  const handleRecordComplete = (message: Message) => {
    setMessages([...messages, message]);
    setCurrentScreen('messages');
  };

  const handleNavigateToMessages = () => {
    setCurrentScreen('messages');
  };

  const handleNavigateToRecord = () => {
    setCurrentScreen('record');
  };

  return (
    <>
      {currentScreen === 'identification' && (
        <IdentificationScreen onComplete={handleIdentificationComplete} />
      )}
      
      {currentScreen === 'record' && (
        <MainRecordScreen 
          userName={userName}
          onNavigateToMessages={handleNavigateToMessages}
          onRecordComplete={handleRecordComplete}
        />
      )}
      
      {currentScreen === 'messages' && (
        <MessagesScreen 
          messages={messages}
          currentUserName={userName}
          onNavigateToRecord={handleNavigateToRecord}
        />
      )}
      
      <Toaster />
    </>
  );
}
