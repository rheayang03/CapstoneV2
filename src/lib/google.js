let scriptPromise = null;

function loadGoogleScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (
      typeof window !== 'undefined' &&
      window.google &&
      window.google.accounts
    ) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = (e) =>
      reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

function initGoogleId(callback) {
  const clientId =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_GOOGLE_CLIENT_ID) ||
    '';
  if (!clientId) throw new Error('Missing VITE_GOOGLE_CLIENT_ID');
  if (
    !(
      typeof window !== 'undefined' &&
      window.google &&
      window.google.accounts &&
      window.google.accounts.id
    )
  ) {
    throw new Error('Google Identity not available');
  }
  // Initialize with callback that receives an ID token in response.credential
  window.google.accounts.id.initialize({ client_id: clientId, callback });
}

function hasGIS() {
  return (
    typeof window !== 'undefined' &&
    window.google &&
    window.google.accounts &&
    window.google.accounts.id
  );
}

export async function signInWithGoogle({ timeoutMs = 60000 } = {}) {
  await loadGoogleScript();
  return new Promise((resolve, reject) => {
    let settled = false;
    const onCredential = (response) => {
      if (settled) return;
      const cred = response && response.credential;
      if (cred) {
        settled = true;
        resolve(cred);
      }
    };

    try {
      if (!hasGIS()) throw new Error('Google Identity not available');
      initGoogleId(onCredential);
      // Trigger One Tap account chooser; may be suppressed by browser policy
      window.google.accounts.id.prompt((notification) => {
        // If One Tap was dismissed or failed and no credential arrived, let the caller choose another flow
        if (settled) return;
        const type =
          notification &&
          notification.getMomentType &&
          notification.getMomentType();
        const dismissed =
          type === 'display_not_displayed' ||
          type === 'skipped' ||
          type === 'dismissed';
        if (dismissed) {
          // No credential produced; caller can render a dedicated button
        }
      });
    } catch (e) {
      reject(e);
      return;
    }

    if (timeoutMs > 0) {
      setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Google sign-in timed out'));
        }
      }, timeoutMs);
    }
  });
}

export default {
  signInWithGoogle,
};

export async function renderGoogleButton(
  container,
  options = {},
  onCredential
) {
  await loadGoogleScript();
  const target = container && container.current ? container.current : container;
  if (!target) throw new Error('Missing container element for Google button');
  initGoogleId((response) => {
    try {
      const cred =
        response && response.credential ? response.credential : response;
      if (onCredential && cred) onCredential(cred);
    } catch {}
  });
  const style = {
    type: 'standard',
    theme: options.theme || 'outline',
    size: options.size || 'large',
    text: options.text || 'continue_with',
    shape: options.shape || 'rectangular',
    width: options.width || 320,
    logo_alignment: options.logo_alignment || 'left',
  };
  if (!hasGIS() || !window.google.accounts.id.renderButton) {
    throw new Error('Google Identity not available');
  }
  window.google.accounts.id.renderButton(target, style);
}
