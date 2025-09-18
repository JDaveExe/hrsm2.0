import React, { useState, useEffect } from 'react';
import './LoadingManagementBar.css';

const LoadingManagementBar = ({ 
  message = "Loading...", 
  duration = 'normal', // 'fast', 'normal', 'slow'
  customStages = null 
}) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const durationMultiplier = {
      'fast': 0.6,
      'normal': 1,
      'slow': 1.8
    }[duration] || 1;

    const defaultStages = [
      { duration: 800 * durationMultiplier, progress: 15, message: "Initializing..." },
      { duration: 1200 * durationMultiplier, progress: 35, message: "Loading data..." },
      { duration: 1000 * durationMultiplier, progress: 60, message: "Processing..." },
      { duration: 800 * durationMultiplier, progress: 80, message: "Finalizing..." },
      { duration: 600 * durationMultiplier, progress: 95, message: "Almost ready..." }
    ];

    const stages = customStages || defaultStages;
    let currentStage = 0;
    let timeoutId;

    const progressToNextStage = () => {
      if (!mounted) return;

      if (currentStage < stages.length) {
        const currentStageData = stages[currentStage];
        setProgress(currentStageData.progress);
        setStage(currentStage);
        
        timeoutId = setTimeout(() => {
          currentStage++;
          progressToNextStage();
        }, currentStageData.duration);
      } else {
        // Final stage - simulate completion
        setProgress(100);
        timeoutId = setTimeout(() => {
          if (mounted) {
            // Reset and restart cycle if component is still mounted
            currentStage = 0;
            setProgress(0);
            setStage(0);
            progressToNextStage();
          }
        }, 1000);
      }
    };

    progressToNextStage();

    return () => {
      setMounted(false);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [duration, customStages, mounted]);

  const stages = [
    "Initializing...",
    "Loading data...",
    "Processing...",
    "Finalizing...",
    "Almost ready..."
  ];

  const currentMessage = stages[stage] || message;

  return (
    <div className="loading-management-container">
      <div className="loading-management-content">
        <div className="loading-management-bar">
          <div 
            className="loading-management-progress"
            style={{ 
              width: `${progress}%`,
              transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          ></div>
        </div>
        <p className="loading-management-text">{currentMessage}</p>
        <div className="loading-percentage">{progress}%</div>
      </div>
    </div>
  );
};

export default LoadingManagementBar;
