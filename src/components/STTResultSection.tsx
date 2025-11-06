import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Copy, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { motion, AnimatePresence } from "motion/react";

interface STTResultSectionProps {
  result: {
    text: string;
    speaker: string;
    duration?: string;
    accuracy?: number;
  } | null;
  error?: string | null;
}

export function STTResultSection({ result, error }: STTResultSectionProps) {
  const handleCopyText = () => {
    if (!result) return;
    
    navigator.clipboard.writeText(result.text);
    toast.success("Текст скопирован в буфер обмена");
  };

  const handleDownloadText = () => {
    if (!result) return;
    
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcription_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Файл загружен");
  };

  return (
    <Card className="bg-white border-gray-200 rounded-[10px] p-6 shadow-sm">
      <h2 className="text-[17px] text-gray-900 mb-3">Результаты распознавания</h2>
      
      <div className="space-y-5">
        {/* Empty State */}
        {!result && !error && (
          <div className="flex items-center justify-center py-16 px-4">
            <div className="text-center max-w-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <p className="text-[14px] text-gray-500">
                Здесь появится текст после распознавания.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-[8px] text-red-700"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[14px]">Не удалось распознать. Повторите попытку.</p>
                {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success State */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* Identified Speaker */}
              <div className="space-y-2">
                <Label htmlFor="identified-speaker" className="text-[14px] text-gray-700">
                  Определённый спикер
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-[8px] border-0 text-[13px]">
                    {result.speaker}
                  </Badge>
                </div>
              </div>

              {/* Transcription Text */}
              <div className="space-y-2">
                <Label htmlFor="transcription-text" className="text-[14px] text-gray-700">
                  Распознанный текст
                </Label>
                <Textarea
                  id="transcription-text"
                  value={result.text}
                  readOnly
                  rows={10}
                  className="bg-gray-50 border-gray-300 rounded-[8px] resize-none text-gray-700 text-[14px]"
                />
              </div>

              {/* Metadata */}
              {(result.duration || result.accuracy) && (
                <div className="flex items-center gap-4 text-[13px] text-gray-500">
                  {result.duration && (
                    <span>Длительность: {result.duration}</span>
                  )}
                  {result.duration && result.accuracy && (
                    <span>•</span>
                  )}
                  {result.accuracy && (
                    <span>Точность: {result.accuracy.toFixed(2)}</span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  onClick={handleCopyText}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50 rounded-[8px] text-gray-700 transition-colors text-[13px]"
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Копировать текст
                </Button>
                <Button
                  onClick={handleDownloadText}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50 rounded-[8px] text-gray-700 transition-colors text-[13px]"
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Скачать .txt
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
