import { useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Mic, Clock, Play, Pause, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";

interface Message {
  id: string;
  userName: string;
  audioUrl: string;
  duration: string;
  timestamp: string;
  text: string;
}

interface MessagesScreenProps {
  messages: Message[];
  currentUserName: string;
  onNavigateToRecord: () => void;
}

export function MessagesScreen({ messages, currentUserName, onNavigateToRecord }: MessagesScreenProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedTextId, setExpandedTextId] = useState<string | null>(null);

  const togglePlay = (messageId: string) => {
    setPlayingId(playingId === messageId ? null : messageId);
  };

  const toggleText = (messageId: string) => {
    setExpandedTextId(expandedTextId === messageId ? null : messageId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <h1 className="text-center text-gray-900">Сообщения</h1>
      </div>

      {/* Messages List */}
      <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-[15px] text-gray-500">
              Записанных сообщений пока нет
            </p>
            <p className="text-[13px] text-gray-400 mt-2">
              Нажмите на микрофон, чтобы создать запись
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const userInitial = message.userName.charAt(0).toUpperCase();
            const isPlaying = playingId === message.id;
            const isTextExpanded = expandedTextId === message.id;
            const isCurrentUser = message.userName === currentUserName;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white border-gray-200 rounded-[12px] p-4 shadow-sm">
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 bg-[#4A6FA5] flex-shrink-0">
                      <AvatarFallback className="bg-[#4A6FA5] text-white text-[14px]">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[15px] text-gray-900">
                          {message.userName}
                          {isCurrentUser && (
                            <span className="text-[13px] text-gray-500 ml-2">(вы)</span>
                          )}
                        </p>
                        <span className="text-[13px] text-gray-500">
                          {message.timestamp}
                        </span>
                      </div>

                      {/* Audio Player */}
                      <div className="bg-gray-50 rounded-[10px] p-3 mb-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePlay(message.id)}
                            className="h-10 w-10 rounded-full bg-[#4A6FA5] hover:bg-[#3d5a89] flex items-center justify-center text-white transition-colors flex-shrink-0"
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5 ml-0.5" />
                            )}
                          </button>

                          {/* Progress Bar */}
                          <div className="flex-1">
                            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-[#4A6FA5]"
                                initial={{ width: "0%" }}
                                animate={{ width: isPlaying ? "100%" : "0%" }}
                                transition={{ duration: 3, ease: "linear" }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[12px] text-gray-500">
                                {isPlaying ? "0:03" : "0:00"}
                              </span>
                              <span className="text-[12px] text-gray-500">
                                {message.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transcription Toggle */}
                      <button
                        onClick={() => toggleText(message.id)}
                        className="flex items-center gap-2 text-[13px] text-[#4A6FA5] hover:text-[#3d5a89] transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        <span>{isTextExpanded ? "Скрыть текст" : "Показать текст"}</span>
                      </button>

                      {/* Expanded Text */}
                      <AnimatePresence>
                        {isTextExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 p-3 bg-blue-50 rounded-[8px] border border-blue-100">
                              <p className="text-[14px] text-gray-700 leading-relaxed">
                                {message.text}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-5 py-4 fixed bottom-0 left-0 right-0">
        <div className="max-w-md mx-auto flex justify-around">
          <button 
            onClick={onNavigateToRecord}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <div className="h-12 w-12 rounded-full flex items-center justify-center">
              <Mic className="h-6 w-6" />
            </div>
            <span className="text-[12px]">Запись</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-[#4A6FA5]">
            <div className="h-12 w-12 rounded-full bg-[#4A6FA5] bg-opacity-10 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-[12px]">История</span>
          </button>
        </div>
      </div>
    </div>
  );
}
