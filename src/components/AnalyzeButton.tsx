
import { Button } from "@/components/ui/button";

interface AnalyzeButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading?: boolean;
}

const AnalyzeButton = ({ onClick, isDisabled, isLoading = false }: AnalyzeButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className="w-full py-3 text-lg font-medium bg-blue-400 hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      size="lg"
    >
      {isLoading ? "Analyzing..." : "Analyze Resume"}
    </Button>
  );
};

export default AnalyzeButton;
