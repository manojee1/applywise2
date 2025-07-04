
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';

interface ResumeUploaderProps {
  onFileSelect: (file: File | null) => void;
  onTextExtracted: (text: string) => void;
}

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ResumeUploader = ({ onFileSelect, onTextExtracted }: ResumeUploaderProps) => {
  const [fileName, setFileName] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type === "application/pdf") {
      setFileName(file.name);
      setIsExtracting(true);
      onFileSelect(file);
      
      try {
        const extractedText = await extractTextFromPDF(file);
        onTextExtracted(extractedText);
      } catch (error) {
        alert("Failed to extract text from PDF. Please try again or paste the text manually.");
        onTextExtracted("");
      } finally {
        setIsExtracting(false);
      }
    } else if (file) {
      alert("Please select a PDF file");
      e.target.value = "";
      setFileName("");
      onFileSelect(null);
      onTextExtracted("");
    } else {
      setFileName("");
      onFileSelect(null);
      onTextExtracted("");
    }
  };

  const handleClearFile = () => {
    setFileName("");
    onFileSelect(null);
    onTextExtracted("");
    // Clear the input value
    const fileInput = document.getElementById("resume-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="resume-upload" className="text-base font-medium text-gray-700">
        Resume (PDF only) <span className="text-red-500">*</span>
      </Label>
      <div className="flex items-center space-x-2">
        <Input
          id="resume-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      {fileName && (
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border">
          <p className="text-sm text-gray-600">
            Selected: {fileName}
            {isExtracting && <span className="ml-2 text-blue-600">Extracting text...</span>}
          </p>
          <button
            onClick={handleClearFile}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
