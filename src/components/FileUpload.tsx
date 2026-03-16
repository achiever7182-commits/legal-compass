import { useState, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { analyzeCase } from "@/lib/api";
import { toast } from "sonner";

interface FileUploadProps {
  onAnalysisComplete: () => void;
}

export default function FileUpload({ onAnalysisComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt", "docx"].includes(ext || "")) {
      toast.error("Unsupported file format. Please upload PDF, DOCX, or TXT.");
      return;
    }

    setIsAnalyzing(true);
    setCurrentFile(file.name);

    try {
      let text = "";
      if (ext === "txt") {
        text = await file.text();
      } else {
        // For PDF/DOCX, read as text (basic extraction)
        text = await file.text();
      }

      if (text.trim().length < 20) {
        toast.error("File appears to be empty or too short to analyze.");
        return;
      }

      await analyzeCase(text, file.name);
      toast.success(`Analysis complete: ${file.name}`);
      onAnalysisComplete();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
      setCurrentFile(null);
    }
  }, [onAnalysisComplete]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(processFile);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/30"
      }`}
    >
      {isAnalyzing ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary shimmer rounded-full" style={{ width: "100%" }} />
          </div>
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-sm text-foreground font-medium">Analyzing {currentFile}…</p>
          <p className="text-xs text-muted-foreground">AI is extracting evidence, strategy, and priority</p>
        </div>
      ) : (
        <label className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Drop case files here</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT — up to 15,000 characters</p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
    </div>
  );
}
