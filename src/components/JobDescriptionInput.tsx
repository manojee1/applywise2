
import { forwardRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

const JobDescriptionInput = forwardRef<HTMLTextAreaElement, JobDescriptionInputProps>(
  ({ value, onChange }, ref) => {
    const countWords = (text: string): number => {
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const handleBlur = () => {
      console.log("Job description onBlur triggered, value length:", value.length);
      if (!value.trim()) return;
      
      const wordCount = countWords(value);
      console.log("Job description word count:", wordCount);
      if (wordCount > 900) {
        console.log("Job description validation failed - showing toast");
        toast({
          title: "Job description too long",
          description: `Please reduce your job description to 900 words or less. Current: ${wordCount} words.`,
          variant: "destructive",
        });
        if (ref && 'current' in ref && ref.current) {
          console.log("Selecting job description text");
          ref.current.select();
        }
      }
    };

    return (
      <div className="space-y-2">
        <Label htmlFor="job-description" className="text-base font-medium text-gray-700">
          Job Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          ref={ref}
          id="job-description"
          placeholder="Paste the job description here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className="min-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
    );
  }
);

JobDescriptionInput.displayName = "JobDescriptionInput";

export default JobDescriptionInput;
