import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Mic, Clock, Play, Pause, FileText, RefreshCw } from "lucide-react";
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

export function MessagesScreen({ messages: initialMessages, currentUserName, onNavigateToRecord }: MessagesScreenProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedTextId, setExpandedTextId] = useState<string | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<Record<string, HTMLAudioElement>>({});
  const [currentTime, setCurrentTime] = useState<Record<string, number>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const togglePlay = async (messageId: string, audioUrl: string) => {
    if (playingId === messageId) {
      // Останавливаем воспроизведение
      if (audioRefs[messageId]) {
        audioRefs[messageId].pause();
      }
      setPlayingId(null);
    } else {
      // Останавливаем предыдущее воспроизведение
      if (playingId && audioRefs[playingId]) {
        audioRefs[playingId].pause();
        audioRefs[playingId].currentTime = 0;
      }
      
      // Создаем или используем существующий audio элемент
      let audio = audioRefs[messageId];
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.addEventListener('loadedmetadata', () => {
          setDurations(prev => ({ ...prev, [messageId]: audio.duration }));
        });
        audio.addEventListener('timeupdate', () => {
          setCurrentTime(prev => ({ ...prev, [messageId]: audio.currentTime }));
        });
        audio.addEventListener('ended', () => {
          setPlayingId(null);
          setCurrentTime(prev => ({ ...prev, [messageId]: 0 }));
        });
        setAudioRefs(prev => ({ ...prev, [messageId]: audio }));
      }
      
      try {
        await audio.play();
        setPlayingId(messageId);
      } catch (err) {
        console.error('Ошибка воспроизведения аудио:', err);
      }
    }
  };

  const toggleText = (messageId: string) => {
    setExpandedTextId(expandedTextId === messageId ? null : messageId);
  };

  // Функция для форматирования времени
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Функция для обработки аудио данных (может быть путь, blob или base64)
  const processAudioData = async (item: any, messageId: string, apiHost: string, apiPort: string): Promise<string> => {
    // Если это путь/URL к файлу
    if (item.audio_file_path || item.audio_url || item.audioUrl) {
      return item.audio_file_path || item.audio_url || item.audioUrl;
    }
    
    // Если это base64 строка
    if (item.audio_base64 || item.audio_data) {
      const base64Data = item.audio_base64 || item.audio_data;
      // Убираем префикс data:audio/...;base64, если есть
      const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      
      try {
        // Преобразуем base64 в blob
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: item.audio_mime_type || 'audio/wav' });
        
        // Создаем blob URL
        const blobUrl = URL.createObjectURL(blob);
        setBlobUrls(prev => ({ ...prev, [messageId]: blobUrl }));
        return blobUrl;
      } catch (err) {
        console.error('Ошибка обработки base64 аудио:', err);
        return '';
      }
    }
    
    // Если это бинарные данные (Blob) - обычно приходит в отдельном запросе
    // Но если бэкенд возвращает blob напрямую в JSON, это будет base64
    // Поэтому этот случай уже обработан выше
    
    // Fallback: пытаемся загрузить по имени файла
    if (item.file_name || item.id) {
      return `http://${apiHost}:${apiPort}/uploads/${item.file_name || item.id}`;
    }
    
    return '';
  };

  // Функция для парсинга времени из строки
  const parseTimestamp = (timestamp: string): Date => {
    // Пытаемся распарсить разные форматы времени
    // Формат может быть: "12:30", "2024-01-01 12:30:00", ISO строка и т.д.
    if (!timestamp) return new Date(0);
    
    // Если это просто время "HH:MM" или "HH:MM:SS"
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timestamp)) {
      const [hours, minutes, seconds = '0'] = timestamp.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);
      return date;
    }
    
    // Пытаемся распарсить как ISO строку или другой формат
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

  // Функция для сортировки сообщений по времени (новые сверху)
  const sortMessagesByTime = (messages: Message[]): Message[] => {
    return [...messages].sort((a, b) => {
      const timeA = parseTimestamp(a.timestamp);
      const timeB = parseTimestamp(b.timestamp);
      return timeB.getTime() - timeA.getTime(); // Новые сверху
    });
  };

  // Функция для загрузки сообщений с бэкенда
  const fetchMessages = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const apiHost = (import.meta as any).env?.VITE_API_HOST || window.location.hostname;
      const apiPort = (import.meta as any).env?.VITE_API_PORT || '4010';
      
      const response = await fetch(`http://${apiHost}:${apiPort}/messages`);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Преобразуем данные с бэкенда в формат Message
      // Поддерживаем разные форматы: путь к файлу, base64, или blob
      const formattedMessagesPromises = data.map(async (item: any, index: number) => {
        const messageId = item.id || item.file_name || `msg-${index}`;
        const audioUrl = await processAudioData(item, messageId, apiHost, apiPort);
        
        return {
          id: messageId,
          userName: item.speaker_name || item.user_name || item.userName || "Неизвестный",
          audioUrl: audioUrl,
          duration: item.duration || "0:00",
          timestamp: item.created_at || item.timestamp || new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          text: item.transcription || item.text || ""
        };
      });
      
      const formattedMessages = await Promise.all(formattedMessagesPromises);
      // Сортируем сообщения по времени (новые сверху)
      const sortedMessages = sortMessagesByTime(formattedMessages);
      setMessages(sortedMessages);
    } catch (err: any) {
      console.error('Ошибка при загрузке сообщений:', err);
      setError(err.message || 'Не удалось загрузить сообщения');
      // Оставляем начальные сообщения при ошибке
      setMessages(initialMessages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Загружаем сообщения при монтировании компонента
  useEffect(() => {
    fetchMessages();
  }, []);

  // Очистка аудио элементов и blob URLs при размонтировании
  useEffect(() => {
    return () => {
      // Останавливаем все аудио
      Object.values(audioRefs).forEach((audio) => {
        if (audio instanceof HTMLAudioElement) {
          audio.pause();
          audio.src = '';
        }
      });
      // Освобождаем blob URLs
      Object.values(blobUrls).forEach((url) => {
        if (typeof url === 'string') {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [audioRefs, blobUrls]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-center text-gray-900 flex-1">Сообщения</h1>
          <button
            onClick={() => fetchMessages(true)}
            disabled={refreshing || loading}
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Обновить"
          >
            <RefreshCw 
              className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 animate-pulse">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-[15px] text-gray-500">
              Загрузка сообщений...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-[15px] text-red-500 mb-2">
              {error}
            </p>
            <button
              onClick={() => fetchMessages(false)}
              className="text-[13px] text-[#4A6FA5] hover:text-[#3d5a89] transition-colors mt-2"
            >
              Попробовать снова
            </button>
          </div>
        ) : messages.length === 0 ? (
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
                            onClick={() => togglePlay(message.id, message.audioUrl)}
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
                                animate={{ 
                                  width: isPlaying && durations[message.id] 
                                    ? `${(currentTime[message.id] || 0) / durations[message.id] * 100}%` 
                                    : "0%" 
                                }}
                                transition={{ duration: 0.1, ease: "linear" }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[12px] text-gray-500">
                                {formatTime(currentTime[message.id] || 0)}
                              </span>
                              <span className="text-[12px] text-gray-500">
                                {durations[message.id] ? formatTime(durations[message.id]) : message.duration}
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
