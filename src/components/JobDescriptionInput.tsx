
import { forwardRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const JobDescriptionInput = forwardRef<HTMLTextAreaElement, JobDescriptionInputProps>(
  ({ value, onChange, onBlur }, ref) => {
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
        onBlur={onBlur}
        className="min-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        required
      />
    </div>
  );
  }
);

JobDescriptionInput.displayName = "JobDescriptionInput";

export default JobDescriptionInput;
