import { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Upload, Mic, FileAudio } from "lucide-react";

interface STTUploadSectionProps {
  onTranscribe: (text: string, speaker: string, duration: string, accuracy: number) => void;
}

export function STTUploadSection({ onTranscribe }: STTUploadSectionProps) {
  const [speakerName, setSpeakerName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " Б";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
    return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ['.mp3', '.wav', '.flac'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (validTypes.includes(fileExtension)) {
        setSelectedFile(file);
      }
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;

    setTranscribing(true);
    
    // Simulate transcription delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Mock transcription result in Russian
    const mockTranscription = "Это пример расшифровки загруженного аудиофайла. Система распознавания речи обработала аудио и преобразовала его в текстовый формат. Нейросетевой голосовой кодек успешно определил содержание аудиозаписи.";
    const identifiedSpeaker = speakerName || "speaker_7";
    const duration = "01:39";
    const accuracy = 0.94;
    
    onTranscribe(mockTranscription, identifiedSpeaker, duration, accuracy);
    
    setTranscribing(false);
  };

  return (
    <Card className="bg-white border-gray-200 rounded-[10px] p-6 shadow-sm">
      <h2 className="text-[17px] text-gray-900 mb-3">Загрузка аудио для распознавания</h2>
      
      <div className="space-y-5">
        {/* Speaker Name Input (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="stt-speaker-name" className="text-[14px] text-gray-700">
            Имя спикера <span className="text-gray-400">(необязательно)</span>
          </Label>
          <Input
            id="stt-speaker-name"
            type="text"
            placeholder="например, speaker_7"
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            className="bg-white border-gray-300 rounded-[8px] focus:border-slate-400 focus:ring-slate-400 text-[14px]"
            disabled={transcribing}
          />
        </div>

        {/* File Drop Zone */}
        <div className="space-y-2">
          <Label className="text-[14px] text-gray-700">
            Аудиофайл
          </Label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center
              min-h-[90px] px-6 py-6
              border-2 border-dashed rounded-[10px]
              cursor-pointer transition-all duration-200
              ${isDragging 
                ? 'border-slate-400 bg-slate-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
              ${transcribing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.flac"
              onChange={handleFileSelect}
              className="hidden"
              disabled={transcribing}
            />
            
            {selectedFile ? (
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0">
                  <FileAudio className="h-8 w-8 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[13px] text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-[14px] text-gray-600">
                  Перетащите файл сюда или выберите файл
                </p>
                <p className="text-[13px] text-gray-400 mt-1">
                  (.mp3, .wav, .flac)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transcribe Button */}
        <Button
          onClick={handleTranscribe}
          disabled={!selectedFile || transcribing}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[14px] h-10"
        >
          {transcribing ? (
            <>
              <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Идёт распознавание...
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Распознать речь
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
