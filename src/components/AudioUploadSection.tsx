import { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Upload, File } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface AudioUploadSectionProps {
  onUpload: (speakerName: string) => void;
}

export function AudioUploadSection({ onUpload }: AudioUploadSectionProps) {
  const [speakerName, setSpeakerName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!speakerName || !selectedFile) return;

    setUploading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onUpload(speakerName);
    
    // Show success notification
    toast.success("Файл успешно загружен");
    
    // Reset form
    setSpeakerName("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    setUploading(false);
  };

  return (
    <Card className="bg-white border-gray-200 rounded-[10px] p-6 shadow-sm">
      <h2 className="text-[17px] text-gray-900 mb-3">Загрузка аудио</h2>
      
      <div className="space-y-5">
        {/* Speaker Name Input */}
        <div className="space-y-2">
          <Label htmlFor="speaker-name" className="text-[14px] text-gray-700">
            Имя спикера
          </Label>
          <Input
            id="speaker-name"
            type="text"
            placeholder="например, speaker_7"
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            className="bg-white border-gray-300 rounded-[8px] focus:border-slate-400 focus:ring-slate-400 text-[14px]"
            disabled={uploading}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="audio-file" className="text-[14px] text-gray-700">
            Аудиофайл
          </Label>
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              id="audio-file"
              type="file"
              accept=".mp3,.wav,.flac"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full justify-start border-gray-300 hover:bg-gray-50 rounded-[8px] text-gray-700 text-[14px] h-10"
            >
              <File className="mr-2 h-4 w-4" />
              {selectedFile ? selectedFile.name : "Выберите файл (.mp3, .wav, .flac)"}
            </Button>
          </div>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!speakerName || !selectedFile || uploading}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[14px] h-10"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Загрузка..." : "Загрузить"}
        </Button>
      </div>
    </Card>
  );
}
