import React from 'react';

const Stepper = ({ steps, currentStep }) => {
    const progressWidth = currentStep > 1 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 0;

    return (
        <div className="stepper">
            <div className="stepper-progress" style={{ width: `${progressWidth}%` }}></div>
            {steps.map((label, index) => (
                <div className={`step ${index + 1 <= currentStep ? 'active' : ''}`} key={label}>
                    <div className="step-circle">{index + 1}</div>
                    <div className="step-label">{label}</div>
                </div>
            ))}
        </div>
    );
};

export default Stepper;