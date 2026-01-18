import React, { useState } from 'react';
import { Map, Compass, Heart, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: <Map size={64} className="text-blue-600" />,
      title: "Real-Time Guidance",
      desc: "Navigate the city with live maps and context-aware routing."
    },
    {
      icon: <Compass size={64} className="text-teal-600" />,
      title: "Discover Places",
      desc: "Find hidden gems, restaurants, and events happening around you."
    },
    {
      icon: <Heart size={64} className="text-red-500" />,
      title: "Save Favorites",
      desc: "Keep track of places you love and access them anytime."
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="p-8 bg-gray-50 rounded-full shadow-sm">
          {slides[step].icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{slides[step].title}</h2>
          <p className="text-gray-500 leading-relaxed px-4">{slides[step].desc}</p>
        </div>
      </div>

      <div className="pb-8">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 rounded-full transition-all duration-300 ${index === step ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'}`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {step === slides.length - 1 ? 'Get Started' : 'Next'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
