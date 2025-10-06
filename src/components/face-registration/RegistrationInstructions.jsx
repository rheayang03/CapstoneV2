import React from 'react';

const RegistrationInstructions = ({ step }) => {
  if (step !== 'initial') return null;

  return (
    <div className="text-center text-sm text-muted-foreground space-y-2">
      <p>• Ensure good lighting on your face</p>
      <p>• Remove glasses if possible</p>
      <p>• Look directly at the camera</p>
      <p>• Follow the instructions during capture</p>
    </div>
  );
};

export default RegistrationInstructions;