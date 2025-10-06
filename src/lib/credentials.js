// Email-only persistence helpers for the Login page
// We intentionally do NOT store passwords. Users must re-enter passwords.

const LS_EMAIL_KEY = 'remembered_email';

export function getRememberedEmail() {
  try {
    return localStorage.getItem(LS_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function rememberEmail(email) {
  try {
    if (email) localStorage.setItem(LS_EMAIL_KEY, email);
  } catch {}
}

export function clearRememberedEmail() {
  try {
    localStorage.removeItem(LS_EMAIL_KEY);
  } catch {}
}
