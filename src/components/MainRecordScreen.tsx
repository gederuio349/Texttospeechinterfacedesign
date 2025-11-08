import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Mic, Clock } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";

interface MainRecordScreenProps {
  userName: string;
  onNavigateToMessages: () => void;
  onRecordComplete: (message: { id: string; userName: string; audioUrl: string; duration: string; timestamp: string; text: string }) => void;
}

export function MainRecordScreen({ userName, onNavigateToMessages, onRecordComplete }: MainRecordScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [inputLevel, setInputLevel] = useState(0); // Для анимации кнопки
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [speakerName, setSpeakerName] = useState("");
  const [pendingFileName, setPendingFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Для очистки анализатора после stop
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pendingAudioBlobRef = useRef(null);


  const startRecording = async () => {
    try {
      // Проверяем, что navigator существует
      if (typeof navigator === 'undefined') {
        throw new Error('navigator не доступен в этом окружении');
      }

      // Проверяем поддержку getUserMedia и получаем функцию
      let getUserMediaFn: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Современный API
        getUserMediaFn = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      } else {
        // Fallback для старых браузеров
        const legacyGetUserMedia = 
          (navigator as any).getUserMedia ||
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia ||
          (navigator as any).msGetUserMedia;

        if (!legacyGetUserMedia) {
          // Проверяем, не HTTPS ли проблема
          const isSecureContext = window.isSecureContext || 
                                  location.protocol === 'https:' || 
                                  location.hostname === 'localhost' || 
                                  location.hostname === '127.0.0.1';
          
          if (!isSecureContext) {
            throw new Error('getUserMedia требует HTTPS или localhost. Откройте сайт по адресу https://...');
          }
          
          throw new Error('getUserMedia не поддерживается в этом браузере. Обновите браузер до последней версии.');
        }

        // Обёртка для старого API в Promise
        getUserMediaFn = (constraints: MediaStreamConstraints) => {
          return new Promise<MediaStream>((resolve, reject) => {
            legacyGetUserMedia.call(navigator, constraints, resolve, reject);
          });
        };
      }

      const stream = await getUserMediaFn({ audio: true });
      
      // Проверяем поддержку MediaRecorder
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder не поддерживается в этом браузере. Обновите браузер до последней версии.');
      }
      
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      // --- WebAudio анализатор для амплитуды ---
      const audioContext = new ((window.AudioContext || (window as any).webkitAudioContext))();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Анимация громкости
      const animate = () => {
        analyser.getByteTimeDomainData(dataArray);
        // RMS громкость
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          let norm = (dataArray[i] - 128) / 128;
          sum += norm * norm;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        setInputLevel(rms);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
      // --- // ---

      let localChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          localChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Останавливаем анализатор, сбрасываем громкость
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setInputLevel(0);

        const audioBlob = new Blob(localChunks, { type: 'audio/wav' });
        
        // Получаем следующий порядковый номер из localStorage
        const getNextFileNumber = () => {
          const storedNumber = localStorage.getItem('audioFileCounter');
          const nextNumber = storedNumber ? parseInt(storedNumber, 10) + 1 : 1;
          localStorage.setItem('audioFileCounter', nextNumber.toString());
          return nextNumber;
        };

        const fileNumber = getNextFileNumber();
        const fileName = `output${fileNumber}.wav`;

        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        const formData = new FormData();
        formData.append('audio', audioBlob, fileName);
        formData.append('speaker_name', "incognito");
        // Используем hostname вместо localhost для работы в локальной сети
        const apiHost = (import.meta as any).env?.VITE_API_HOST || window.location.hostname;
        const apiPort = (import.meta as any).env?.VITE_API_PORT || '4010';
        fetch(`http://${apiHost}:${apiPort}/stt`, {
          method: 'POST',
          body: formData,
        })
          .then(res => res.json())
          .then(data => {
            console.log('Файл успешно отправлен на сервер:', data);
            
            // Проверяем, нужно ли запросить имя (проверяем разные варианты)
            const isEmptyValue = data.is_speakers_empty;
            const isEmpty = isEmptyValue === "True" || 
                           isEmptyValue === true || 
                           isEmptyValue === "true" ||
                           String(isEmptyValue).toLowerCase() === "true";
            
            if (isEmpty) {
              pendingAudioBlobRef.current = audioBlob;
              setPendingFileName(fileName);
              setShowNameDialog(true);
            } else {
              // Обычная обработка успешного ответа
              // Можно вызвать onRecordComplete если нужно
            }
          })
          .catch(err => {
            console.error('Ошибка при отправке файла на сервер:', err);
          });
      };

      recorder.start();
      setIsRecording(true);
      setErrorMessage(""); // Очищаем предыдущие ошибки
    } catch (error: any) {
      console.error("Error accessing microphone:", error);
      let errorMsg = "Не удалось получить доступ к микрофону.";
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMsg = "Доступ к микрофону запрещён. Пожалуйста, разрешите доступ к микрофону в настройках браузера.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMsg = "Микрофон не найден. Убедитесь, что микрофон подключён и включён.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMsg = "Микрофон уже используется другим приложением.";
      } else if (error.name === "SecurityError") {
        errorMsg = "Ошибка безопасности. Убедитесь, что сайт открыт по HTTPS (https://...).";
      } else if (error.message) {
        errorMsg = error.message;
      } else if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        errorMsg = "Браузер не поддерживает доступ к микрофону. Убедитесь, что вы используете современный браузер и открыли сайт по HTTPS.";
      }
      
      setErrorMessage(errorMsg);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmitName = () => {
    console.log('handleSubmitName вызван, speakerName:', speakerName, 'pendingAudioBlobRef.current:', pendingAudioBlobRef.current);
    
    if (!speakerName.trim() || !pendingAudioBlobRef.current) {
      console.log('Валидация не прошла, speakerName:', speakerName.trim(), 'audioBlob:', !!pendingAudioBlobRef.current);
      return;
    }

    // Сохраняем данные перед закрытием диалога
    const audioBlob = pendingAudioBlobRef.current;
    const fileName = pendingFileName;
    const name = speakerName.trim();

    // Закрываем диалог сразу
    setShowNameDialog(false);
    setSpeakerName("");
    pendingAudioBlobRef.current = null;
    setPendingFileName("");

    // Отправляем запрос в фоне
    console.log('Отправляем запрос с именем:', name);
    const formData = new FormData();
    formData.append('audio', audioBlob, fileName);
    formData.append('speaker_name', name);

    // Используем hostname вместо localhost для работы в локальной сети
    const apiHost = (import.meta as any).env?.VITE_API_HOST || window.location.hostname;
    const apiPort = (import.meta as any).env?.VITE_API_PORT || '4010';
    fetch(`http://${apiHost}:${apiPort}/stt`, {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        console.log('Файл успешно отправлен на сервер с именем:', data);
      })
      .catch(err => {
        console.error('Ошибка при отправке файла на сервер:', err);
      });
  };

  const handleCancelNameDialog = () => {
    setShowNameDialog(false);
    setSpeakerName("");
    pendingAudioBlobRef.current = null;
    setPendingFileName("");
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
            style={{
              transform: isRecording
                ? `scale(${1 + inputLevel * 2.0})`
                : 'scale(1)',
              boxShadow: isRecording && inputLevel > 0.05
                ? `0 0 0 0px #e53e3e55, 0 0 0 ${(inputLevel * 100).toFixed()}px #e53e3e33` : undefined
            }}
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
        
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-xs">
            <p className="text-sm text-red-700 text-center">{errorMessage}</p>
          </div>
        )}
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

      {/* Dialog for speaker name input */}
      {showNameDialog && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
            }}
            onClick={handleCancelNameDialog}
          />
          {/* Modal Content */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.15)',
              width: '90%',
              maxWidth: '500px',
            }}
            onClick={(e) => {
              // Предотвращаем закрытие при клике на само модальное окно
              e.stopPropagation();
            }}
          >
            <h2 className="text-lg font-semibold mb-2">Вашего голоса нет в базе данных</h2>
            <p className="text-sm text-gray-600 mb-4">Укажите ваше имя</p>
            
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Введите ваше имя"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && speakerName.trim()) {
                    handleSubmitName();
                  }
                }}
                autoFocus
                className="w-full"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleCancelNameDialog}
                className="min-w-[100px]"
              >
                Отмена
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Кнопка Отправить кликнута');
                  handleSubmitName();
                }}
                disabled={!speakerName.trim()}
                className="min-w-[100px] bg-[#4A6FA5] hover:bg-[#3d5a89] text-white"
              >
                Отправить
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
