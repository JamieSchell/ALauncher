/**
 * Utility to translate error messages from backend to user's language
 */

import { useLanguageStore } from '../stores/languageStore';
import { getTranslation } from '../i18n';

/**
 * Translate error message from backend to user's language
 * @param errorMessage - Error message from backend (can be in English or already translated)
 * @returns Translated error message
 */
export function translateError(errorMessage: string): string {
  const language = useLanguageStore.getState().language;
  const lowerMessage = errorMessage.toLowerCase();

  // Map common backend error messages to translation keys
  const errorMap: Record<string, string> = {
    'invalid credentials': 'errors.invalidCredentials',
    'invalid email': 'errors.invalidEmail',
    'invalid email format': 'errors.invalidEmail',
    'invalid email address': 'errors.invalidEmail',
    'invalid token': 'errors.invalidToken',
    'invalid or expired token': 'errors.invalidToken',
    'user not found': 'errors.userNotFound',
    'user already exists': 'errors.userAlreadyExists',
    'username is already taken': 'errors.usernameTaken',
    'email is already in use': 'errors.emailTaken',
    'password is too short': 'errors.passwordTooShort',
    'login failed': 'errors.loginFailed',
    'registration failed': 'errors.registrationFailed',
    'validation failed': 'errors.validationFailed',
    'network error': 'errors.networkError',
    'network error: unable to connect to server': 'errors.networkErrorDetail',
    'network error: unable to connect to server. please check your connection and server address.': 'errors.networkErrorDetail',
    'cors error': 'errors.corsError',
    'cors error: cross-origin request blocked': 'errors.corsError',
    'cors error: cross-origin request blocked. please contact administrator.': 'errors.corsError',
    'request timeout': 'errors.timeoutError',
    'request timeout: server did not respond in time': 'errors.timeoutError',
    'request timeout: server did not respond in time. please check your connection.': 'errors.timeoutError',
    'connection refused': 'errors.connectionRefused',
    'connection refused: server is not available': 'errors.connectionRefused',
    'connection refused: server is not available. please check if the server is running.': 'errors.connectionRefused',
    'an error occurred': 'errors.anErrorOccurred',
  };

  // Check for exact match first
  if (errorMap[lowerMessage]) {
    return getTranslation(language, errorMap[lowerMessage]);
  }

  // Check for partial matches
  for (const [key, translationKey] of Object.entries(errorMap)) {
    if (lowerMessage.includes(key)) {
      return getTranslation(language, translationKey);
    }
  }

  // If no translation found, return original message
  // (it might already be translated or be a custom message)
  return errorMessage;
}

/**
 * Hook version for use in React components
 */
export function useTranslateError() {
  const language = useLanguageStore((state) => state.language);

  return (errorMessage: string): string => {
    return translateError(errorMessage);
  };
}

