import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserPlus, RefreshCw } from 'lucide-react';

const RegistrationActions = ({ step, onStartRegistration, onReset, navigate }) => {
  if (step === 'initial') {
    return (
      <>
        <Button 
          onClick={onStartRegistration} 
          className="w-full"
          size="lg"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Start Registration
        </Button>
        <div className="text-center">
          <Link 
            to="/settings" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </Link>
        </div>
      </>
    );
  }
  
  if (step === 'complete') {
    return (
      <div className="space-y-2">
        <Button 
          onClick={() => navigate('/login')} 
          className="w-full"
          size="lg"
        >
          Try Face Scan Login
        </Button>
        <Button 
          onClick={() => navigate('/settings')} 
          variant="outline"
          className="w-full"
        >
          Back to Settings
        </Button>
      </div>
    );
  }
  
  if (step === 'error') {
    return (
      <Button 
        onClick={onReset} 
        className="w-full"
        variant="outline"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    );
  }
  
  return null;
};

export default RegistrationActions;