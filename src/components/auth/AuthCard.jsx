import React, { useId } from 'react';
import PropTypes from 'prop-types';

const AuthCard = ({
  title,
  children,
  className = '',
  cardClassName = '',
  compact = false,
  ...rest
}) => {
  const headingId = useId();

  return (
    <section
      className={`w-full ${compact ? 'max-w-sm' : 'max-w-md'} mx-auto md:mx-0 ${className}`}
      aria-labelledby={title ? headingId : undefined}
      {...rest}
    >
      <div
        className={`bg-white ${compact ? 'p-7 rounded-lg' : 'p-6 rounded-xl'} shadow-lg ${cardClassName}`}
      >
        {title && (
          <h2 id={headingId} className="text-xl font-semibold mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
};

AuthCard.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  cardClassName: PropTypes.string,
  compact: PropTypes.bool,
};

export default AuthCard;
