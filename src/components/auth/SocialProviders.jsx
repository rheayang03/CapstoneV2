import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { renderGoogleButton } from '@/lib/google';

const Divider = () => (
  <div className="mt-5">
    <div className="flex items-center" aria-hidden="true">
      <div className="w-full border-t border-gray-300" />
    </div>
    <div className="mt-2 flex justify-center text-xs">
      <span className="px-2 bg-white text-gray-500">Or</span>
    </div>
  </div>
);

const SocialButton = ({
  provider,
  label,
  onClick,
  pending,
  children,
  href,
}) => {
  const buttonContent = (
    <>
      <span
        className="absolute left-3 inline-flex items-center"
        aria-hidden="true"
      >
        {children}
      </span>
      <span className="w-full text-center">{label}</span>
    </>
  );

  const buttonProps = {
    className:
      'relative inline-flex items-center justify-center h-10 pl-10 pr-4 border border-[#dadce0] rounded bg-white text-[#3c4043] hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full text-[14px] leading-[21px] font-medium',
    style: {
      fontFamily: '"Google Sans", Arial, sans-serif',
      fontStyle: 'normal',
      fontWeight: 500,
      color: 'rgb(60, 64, 67)',
      fontSize: '14px',
      lineHeight: '21px',
    },
    disabled: pending,
    'aria-label': `Continue with ${label}`,
  };

  if (href) {
    return (
      <a href={href} {...buttonProps}>
        {buttonContent}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => onClick?.(provider, e)}
      {...buttonProps}
    >
      {buttonContent}
    </button>
  );
};

SocialButton.propTypes = {
  provider: PropTypes.oneOf(['google', 'facescan']).isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  children: PropTypes.node,
};

/** Specific buttons (still in the same file) */
export const GoogleButton = ({ onClick, onCredential, pending }) => {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await renderGoogleButton(ref, { width: 320 }, (cred) => {
          if (!mounted) return;
          if (onCredential) onCredential(cred);
          else onClick?.('google');
        });
      } catch (e) {
        setFailed(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [onCredential, onClick]);

  if (failed) {
    return (
      <SocialButton
        provider="google"
        label="Google"
        onClick={onClick}
        pending={pending}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      </SocialButton>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div
        ref={ref}
        className="max-w-[320px] w-full"
        aria-label="Continue with Google"
      />
    </div>
  );
};

GoogleButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  onCredential: PropTypes.func,
  pending: PropTypes.bool,
};

export const FaceScanButton = ({ onClick: _onClick, pending }) => (
  <SocialButton
    provider="facescan"
    label="Continue with Face Scan"
    href="/face-scan"
    onClick={_onClick}
    pending={pending}
  >
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 4h4V2H2v6h2V4zm14-2v2h4v4h2V2h-6zm4 18h-4v2h6v-6h-2v4zM4 20v-4H2v6h6v-2H4zm8-14a6 6 0 100 12 6 6 0 000-12z" />
    </svg>
  </SocialButton>
);

FaceScanButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  pending: PropTypes.bool,
};

/**
 * Wrapper that can render any subset of providers.
 * Example: <SocialProviders providers={['google']} onSocial={...} />
 */
const SocialProviders = ({
  onSocial,
  pending,
  providers = ['google', 'facescan'],
  showDivider = true,
}) => {
  const enabled = providers.filter((p) => ['google', 'facescan'].includes(p));
  const gridCols = 'grid-cols-1';

  return (
    <>
      {showDivider && <Divider />}
      <div className={`mt-4 grid ${gridCols} gap-3`}>
        {enabled.includes('google') && (
          <GoogleButton
            onClick={onSocial}
            onCredential={
              onSocial
                ? (cred) => onSocial('google-credential', cred)
                : undefined
            }
            pending={pending}
          />
        )}
        {enabled.includes('facescan') && (
          <div className="w-full flex justify-center">
            <div className="max-w-[320px] w-full">
              <FaceScanButton onClick={onSocial} pending={pending} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

SocialProviders.propTypes = {
  onSocial: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  /** Which providers to show */
  providers: PropTypes.arrayOf(PropTypes.oneOf(['google', 'facescan'])),
  /** Hide the "Or continue with" divider if needed */
  showDivider: PropTypes.bool,
};

export default SocialProviders;
