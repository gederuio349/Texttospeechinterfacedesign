import { useState } from "react";
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
  const [currentScreen, setCurrentScreen] = useState<'record' | 'messages'>('record');
  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

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

  const mockMessages = [
    {
      id: "1",
      userName: "Анна",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: "0:10",
      timestamp: "12:30",
      text: "Это тестовое сообщение. Здесь будет расшифровка аудио."
    },
    {
      id: "2",
      userName: "Иван",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      duration: "0:05",
      timestamp: "12:35",
      text: "Ещё один пример сообщения с краткой расшифровкой."
    }
  ];

  return (
    <>
      {currentScreen === 'record' && (
        <MainRecordScreen 
          userName={userName}
          onNavigateToMessages={handleNavigateToMessages}
          onRecordComplete={handleRecordComplete}
        />
      )}
      
      {currentScreen === 'messages' && (
        <MessagesScreen 
          messages={messages.length ? messages : mockMessages}
          currentUserName={userName}
          onNavigateToRecord={handleNavigateToRecord}
        />
      )}
      
      <Toaster />
    </>
  );
}
