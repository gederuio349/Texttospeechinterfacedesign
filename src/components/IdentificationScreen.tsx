import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Mic, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface IdentificationScreenProps {
  onComplete: (name: string) => void;
}

export function IdentificationScreen({ onComplete }: IdentificationScreenProps) {
  const [name, setName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);

  const calibrationText = "Привет! Это тест для калибровки моего голоса.";

  const handleRecord = async () => {
    setIsRecording(true);
    setRecordingComplete(false);
    
    // Simulate recording (5 seconds)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    setIsRecording(false);
    setRecordingComplete(true);
  };

  const handleNext = () => {
    if (name && recordingComplete) {
      onComplete(name);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h1 className="text-center mb-8 text-gray-900 text-[20px]">Идентификация</h1>
          
          <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="user-name" className="text-[14px] text-gray-700">
                Имя
              </Label>
              <Input
                id="user-name"
                type="text"
                placeholder="Введите ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white border-gray-300 rounded-[10px] focus:border-[#4A6FA5] focus:ring-[#4A6FA5] text-[15px]"
                disabled={isRecording}
              />
            </div>

            {/* Calibration Text */}
            <div className="space-y-3">
              <Label className="text-[14px] text-gray-700">
                Прочитайте текст для калибровки:
              </Label>
              <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                <p className="text-[15px] text-gray-800 leading-relaxed text-center">
                  "{calibrationText}"
                </p>
              </div>
            </div>

            {/* Record Button */}
            <Button
              onClick={handleRecord}
              disabled={!name || isRecording || recordingComplete}
              className="w-full bg-[#4A6FA5] hover:bg-[#3d5a89] text-white rounded-[10px] h-12 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[15px]"
            >
              {isRecording ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Идёт запись...
                </>
              ) : recordingComplete ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Запись завершена
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Записать текст
                </>
              )}
            </Button>

            {/* Success Message */}
            <AnimatePresence>
              {recordingComplete && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-2 py-2 text-green-700">
                    <Check className="h-4 w-4" />
                    <span className="text-[14px]">Запись завершена.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next Button */}
            <Button
              onClick={handleNext}
              disabled={!name || !recordingComplete}
              className="w-full bg-[#4A6FA5] hover:bg-[#3d5a89] text-white rounded-[10px] h-12 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[15px] shadow-sm"
            >
              Далее
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
