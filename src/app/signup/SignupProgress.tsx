import React from 'react';
import { Stack } from 'react-bootstrap';

interface SignupProgressProps {
  currentStep: number;
  totalSteps: number;
}

// Basic styled progress indicator
const SignupProgress: React.FC<SignupProgressProps> = ({ currentStep, totalSteps }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <Stack direction="horizontal" gap={0} className="justify-content-center mb-5">
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const isLastStep = step === totalSteps;

        return (
          <React.Fragment key={step}>
            <div
              // eslint-disable-next-line max-len
              className={`rounded-circle d-flex align-items-center justify-content-center fw-semibold ${isActive || isCompleted ? 'bg-primary text-white' : 'bg-body-secondary text-body-secondary'}`}
              style={{ width: '32px', height: '32px', zIndex: 1 }}
            >
              {step}
            </div>
            {!isLastStep && (
              <div
                className={`flex-grow-1 ${isCompleted ? 'bg-primary' : 'bg-body-secondary'}`}
                style={{ height: '4px', marginLeft: '-2px', marginRight: '-2px' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Stack>
  );
};

export default SignupProgress;
