import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Search, FileText, Target, Lightbulb } from "lucide-react";

interface AnalysisProgressProps {
  isVisible: boolean;
}

const AnalysisProgress = ({ isVisible }: AnalysisProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: FileText,
      title: "Reading your resume...",
      message: "Scanning through your impressive accomplishments! 📄✨",
      duration: 2000,
    },
    {
      icon: Search,
      title: "Analyzing job requirements...", 
      message: "Decoding what the hiring manager really wants 🕵️‍♂️",
      duration: 2500,
    },
    {
      icon: Brain,
      title: "AI brain is thinking...",
      message: "Our AI is having a lightbulb moment about your fit! 💡🤖",
      duration: 3000,
    },
    {
      icon: Target,
      title: "Finding perfect matches...",
      message: "Connecting the dots between you and your dream job! 🎯",
      duration: 2000,
    },
    {
      icon: Lightbulb,
      title: "Generating recommendations...",
      message: "Crafting personalized advice just for you! ✨📝",
      duration: 2500,
    }
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    let timeouts: NodeJS.Timeout[] = [];
    let currentTime = 0;
    
    steps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index);
        // Don't reach 100% until the very end - cap at 90% for last step
        const progressValue = index === steps.length - 1 ? 90 : ((index + 1) / steps.length) * 90;
        setProgress(progressValue);
      }, currentTime);
      
      timeouts.push(timeout);
      currentTime += step.duration;
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const CurrentIcon = steps[currentStep]?.icon || Brain;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <Card className="w-full max-w-md mx-4 animate-scale-in">
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                <CurrentIcon className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">
                {steps[currentStep]?.title || "Processing..."}
              </h3>
              <p className="text-gray-600 text-sm">
                {steps[currentStep]?.message || "Working hard to analyze your resume!"}
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500">
                {Math.round(progress)}% complete
              </p>
            </div>

            <div className="flex justify-center space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index <= currentStep ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisProgress;