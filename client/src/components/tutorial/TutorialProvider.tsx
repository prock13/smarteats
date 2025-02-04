import { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TutorialStep {
  title: string;
  description: string;
  targetElement: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Macro Meal Planner! 👋",
    description: "Let's take a quick tour to help you get started with planning your meals and tracking nutrition.",
    targetElement: "body",
    placement: "center"
  },
  {
    title: "Calendar Planning",
    description: "Click here to plan your meals for different days. You can add breakfast, lunch, dinner, and snacks.",
    targetElement: "[data-tutorial='calendar-link']",
    placement: "bottom"
  },
  {
    title: "Recipe Management",
    description: "Browse and manage your favorite recipes here. You can also create new recipes!",
    targetElement: "[data-tutorial='recipes-link']",
    placement: "bottom"
  },
  {
    title: "Track Your Favorites",
    description: "Save your favorite meals here for quick access when planning.",
    targetElement: "[data-tutorial='favorites-link']",
    placement: "bottom"
  },
  {
    title: "Your Profile",
    description: "Customize your preferences and nutrition goals in your profile settings.",
    targetElement: "[data-tutorial='profile-button']",
    placement: "bottom"
  }
];

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('tutorial-completed');
    if (!seen) {
      setIsActive(true);
      setHasSeenTutorial(false);
    } else {
      setHasSeenTutorial(true);
    }
  }, []);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const endTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('tutorial-completed', 'true');
    setHasSeenTutorial(true);
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
      }}
    >
      {children}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
            >
              <Card className="w-[400px]">
                <CardHeader>
                  <CardTitle>{tutorialSteps[currentStep].title}</CardTitle>
                  <CardDescription>
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{tutorialSteps[currentStep].description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={currentStep === 0 ? endTutorial : prevStep}
                  >
                    {currentStep === 0 ? "Skip" : "Previous"}
                  </Button>
                  <Button onClick={nextStep}>
                    {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TutorialContext.Provider>
  );
}
