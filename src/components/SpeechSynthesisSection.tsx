import { useState } from "react";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Download, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SpeechSynthesisSectionProps {
  speakers: string[];
}

export function SpeechSynthesisSection({ speakers }: SpeechSynthesisSectionProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [inputText, setInputText] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizedAudio, setSynthesizedAudio] = useState<string | null>(null);

  const handleSynthesize = async () => {
    if (!selectedSpeaker || !inputText) return;

    setSynthesizing(true);
    setSynthesizedAudio(null);
    
    // Simulate synthesis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a mock audio URL (in a real app, this would be the synthesized audio)
    setSynthesizedAudio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    
    setSynthesizing(false);
  };

  const handleDownload = () => {
    if (!synthesizedAudio) return;
    
    // In a real app, this would trigger a download of the synthesized audio
    const link = document.createElement("a");
    link.href = synthesizedAudio;
    link.download = `synthesized_${selectedSpeaker}_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="bg-white border-gray-200 rounded-[10px] p-6 shadow-sm">
      <h2 className="text-[17px] text-gray-900 mb-3">Синтез речи</h2>
      
      <div className="space-y-5">
        {/* Speaker Selection */}
        <div className="space-y-2">
          <Label htmlFor="speaker-select" className="text-[14px] text-gray-700">
            Выберите спикера
          </Label>
          <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker} disabled={synthesizing}>
            <SelectTrigger 
              id="speaker-select"
              className="bg-white border-gray-300 rounded-[8px] focus:border-slate-400 focus:ring-slate-400 text-[14px] h-10"
            >
              <SelectValue placeholder="Выберите спикера" />
            </SelectTrigger>
            <SelectContent className="rounded-[8px]">
              {speakers.map((speaker) => (
                <SelectItem key={speaker} value={speaker} className="text-[14px]">
                  {speaker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <Label htmlFor="input-text" className="text-[14px] text-gray-700">
            Текст для синтеза
          </Label>
          <Textarea
            id="input-text"
            placeholder="Введите текст для синтеза..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            disabled={synthesizing}
            className="bg-white border-gray-300 rounded-[8px] focus:border-slate-400 focus:ring-slate-400 resize-none text-[14px]"
          />
        </div>

        {/* Synthesize Button */}
        <Button
          onClick={handleSynthesize}
          disabled={!selectedSpeaker || !inputText || synthesizing}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[14px] h-10"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {synthesizing ? "Синтезирование..." : "Синтезировать"}
        </Button>

        {/* Result Section with Animation */}
        <AnimatePresence>
          {synthesizedAudio && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-3 pt-5 border-t border-gray-200 overflow-hidden"
            >
              <Label className="text-[14px] text-gray-700">Результат</Label>
              
              {/* Audio Player */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <audio
                  controls
                  src={synthesizedAudio}
                  className="w-full rounded-[8px]"
                  style={{
                    height: "48px",
                    filter: "grayscale(20%)"
                  }}
                />
              </motion.div>

              {/* Download Button */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50 rounded-[8px] text-gray-700 transition-colors text-[14px] h-10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Скачать
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
