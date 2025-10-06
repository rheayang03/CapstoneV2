import React from 'react';

const PageTransition = ({ children, className = "" }) => {
  return (
    <div className={`page-transition ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;