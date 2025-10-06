import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const RegistrationStatus = ({ step }) => {
  if (step === 'complete') {
    return (
      <div className="w-full h-64 bg-muted rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-border">
        <div className="text-center text-green-600">
          <CheckCircle className="w-16 h-16 mx-auto mb-2" />
          <p className="font-medium">Registration complete!</p>
          <p className="text-sm text-muted-foreground">Face scan login is now enabled</p>
        </div>
      </div>
    );
  }
  
  if (step === 'error') {
    return (
      <div className="w-full h-64 bg-muted rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-border">
        <div className="text-center text-destructive">
          <XCircle className="w-16 h-16 mx-auto mb-2" />
          <p className="font-medium">Registration failed</p>
          <p className="text-sm text-muted-foreground">Please try again</p>
        </div>
      </div>
    );
  }
  
  return null;
};

export default RegistrationStatus;