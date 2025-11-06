import { useState } from "react";
import { Button } from "./ui/button";
import { Mic, Clock } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface MainRecordScreenProps {
  userName: string;
  onNavigateToMessages: () => void;
  onRecordComplete: (message: { id: string; userName: string; audioUrl: string; duration: string; timestamp: string; text: string }) => void;
}

export function MainRecordScreen({ userName, onNavigateToMessages, onRecordComplete }: MainRecordScreenProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handleRecord = async () => {
    setIsRecording(true);
    
    // Simulate recording (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsRecording(false);
    
    // Create a new message
    const newMessage = {
      id: Date.now().toString(),
      userName,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: "0:03",
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      text: "Пример расшифрованного текста голосового сообщения. Система успешно преобразовала аудио в текст."
    };
    
    onRecordComplete(newMessage);
  };

  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex justify-end">
        <Avatar className="h-10 w-10 bg-[#4A6FA5]">
          <AvatarFallback className="bg-[#4A6FA5] text-white">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-20">
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <Button
            onClick={handleRecord}
            disabled={isRecording}
            className={`
              h-40 w-40 rounded-full shadow-lg
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-[#4A6FA5] hover:bg-[#3d5a89]'
              }
              text-white transition-all duration-200
            `}
          >
            <Mic className="h-16 w-16" />
          </Button>
        </motion.div>
        
        <p className="mt-6 text-[15px] text-gray-600 text-center max-w-xs">
          {isRecording ? "Идёт запись..." : "Нажмите, чтобы записать сообщение"}
        </p>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-5 py-4 fixed bottom-0 left-0 right-0">
        <div className="max-w-md mx-auto flex justify-around">
          <button className="flex flex-col items-center gap-1 text-[#4A6FA5]">
            <div className="h-12 w-12 rounded-full bg-[#4A6FA5] bg-opacity-10 flex items-center justify-center">
              <Mic className="h-6 w-6" />
            </div>
            <span className="text-[12px]">Запись</span>
          </button>
          
          <button 
            onClick={onNavigateToMessages}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <div className="h-12 w-12 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-[12px]">История</span>
          </button>
        </div>
      </div>
    </div>
  );
}
