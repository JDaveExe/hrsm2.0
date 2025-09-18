import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ThemeLoader.css';

const ThemeLoader = ({ isVisible, themeName, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Preparing theme...');

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    const stages = [
      { text: 'Preparing theme...', duration: 200 },
      { text: 'Loading color palette...', duration: 300 },
      { text: 'Updating components...', duration: 400 },
      { text: 'Applying styles...', duration: 300 },
      { text: 'Finalizing theme...', duration: 200 }
    ];

    let currentProgress = 0;
    let stageIndex = 0;

    const updateProgress = () => {
      if (stageIndex >= stages.length) {
        setProgress(100);
        setTimeout(() => {
          onComplete();
        }, 300);
        return;
      }

      const currentStage = stages[stageIndex];
      const stageProgress = 100 / stages.length;
      const targetProgress = (stageIndex + 1) * stageProgress;

      setStage(currentStage.text);

      const progressInterval = setInterval(() => {
        currentProgress += 2;
        setProgress(Math.min(currentProgress, targetProgress));

        if (currentProgress >= targetProgress) {
          clearInterval(progressInterval);
          stageIndex++;
          setTimeout(updateProgress, 100);
        }
      }, currentStage.duration / 10);
    };

    updateProgress();
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const getThemeColor = () => {
    switch (themeName) {
      case 'blue':
        return '#007bff';
      case 'green':
        return '#28a745';
      default:
        return '#dc3545';
    }
  };

  return (
    <div className="theme-loader-overlay">
      <div className="theme-loader-container">
        <div className="theme-loader-content">
          <div className="theme-icon" style={{ color: getThemeColor() }}>
            <i className="bi bi-palette2"></i>
          </div>
          
          <h3 className="theme-loader-title">Applying {themeName} Theme</h3>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: getThemeColor()
                }}
              ></div>
            </div>
            <div className="progress-text">
              {Math.round(progress)}%
            </div>
          </div>
          
          <div className="stage-text">{stage}</div>
          
          <div className="loading-dots">
            <span style={{ color: getThemeColor() }}>●</span>
            <span style={{ color: getThemeColor() }}>●</span>
            <span style={{ color: getThemeColor() }}>●</span>
          </div>
        </div>
      </div>
    </div>
  );
};

ThemeLoader.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  themeName: PropTypes.string.isRequired,
  onComplete: PropTypes.func.isRequired
};

export default ThemeLoader;
