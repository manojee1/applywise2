import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import type { ExtractionValidation } from "@/utils/extractionValidator";

interface ExtractionChecklistProps {
  validation: ExtractionValidation;
}

const CheckItem = ({
  pass,
  warn,
  label,
}: {
  pass: boolean;
  warn?: boolean;
  label: string;
}) => {
  const Icon = pass ? CheckCircle2 : warn ? AlertTriangle : XCircle;
  const color = pass
    ? "text-green-600"
    : warn
    ? "text-yellow-600"
    : "text-red-500";

  return (
    <li className={`flex items-center gap-2 text-sm ${color}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </li>
  );
};

const ExtractionChecklist = ({ validation }: ExtractionChecklistProps) => {
  const {
    wordCount,
    hasEmail,
    hasPhone,
    sectionHeadersFound,
    hasDates,
    garbageCharRatio,
    warnings,
  } = validation;

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Info className="w-4 h-4" />
        Extraction Quality Check
      </div>

      <ul className="space-y-1.5">
        <CheckItem
          pass={wordCount >= 50}
          label={`Word count: ${wordCount} ${wordCount < 50 ? "(too low)" : ""}`}
        />
        <CheckItem
          pass={hasEmail}
          warn={!hasEmail && hasPhone}
          label={
            hasEmail
              ? "Email detected"
              : hasPhone
              ? "Phone detected (no email)"
              : "No contact info found"
          }
        />
        <CheckItem
          pass={sectionHeadersFound.length >= 2}
          warn={sectionHeadersFound.length === 1}
          label={`Sections found: ${sectionHeadersFound.length > 0 ? sectionHeadersFound.join(", ") : "none"}`}
        />
        <CheckItem pass={hasDates} label={hasDates ? "Dates detected" : "No dates found"} />
        <CheckItem
          pass={garbageCharRatio <= 0.05}
          label={
            garbageCharRatio <= 0.05
              ? "Text quality looks good"
              : "Unusual characters detected"
          }
        />
      </ul>

      {warnings.length > 0 && (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 space-y-1">
          {warnings.map((w, i) => (
            <p key={i}>⚠ {w}</p>
          ))}
        </div>
      )}

      {warnings.length === 0 && (
        <p className="text-xs text-green-700">
          All checks passed. Review the text below and edit if needed.
        </p>
      )}
    </div>
  );
};

export default ExtractionChecklist;
