import * as Sentry from '@sentry/react';
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBackend } from '@/hooks/useBackend';
import { theme } from '@/components/theme';

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const EmailForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasExistingEmail, setHasExistingEmail] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { submitEmail, getEmail } = useBackend();

  // Check if user already has an email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const result = await getEmail();
        if (result?.email) {
          setEmail(result.email);
          setHasExistingEmail(true);
        }
      } catch (error) {
        // 404 is expected when user hasn't set an email yet - silently ignore
        // But log other unexpected errors to Sentry
        if (error instanceof Error && !error.message.includes('404')) {
          Sentry.captureException(error);
        }
      }
    };
    fetchEmail();
  }, [getEmail]);

  const validateEmail = (email: string): boolean => {
    try {
      emailSchema.parse(email);
      setValidationError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await submitEmail(email);
      setMessage({ type: 'success', text: 'Email saved successfully!' });
      setHasExistingEmail(true);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      Sentry.captureException(error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save email',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`px-3 sm:px-6 py-4 border-t ${theme.cardBorder}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
      >
        <div>
          <p className="text-white text-sm font-medium mb-1">Want to receive email updates?</p>
          {hasExistingEmail && !isExpanded && (
            <p className={`text-xs ${theme.textMuted}`}>
              Current email: <span className="text-white">{email}</span>
            </p>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {hasExistingEmail && (
            <p className={`text-xs ${theme.textMuted}`}>
              Current email: <span className="text-white">{email}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError(null);
                }}
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button type="submit" disabled={isSubmitting} variant="primary" size="sm">
                {isSubmitting ? 'Saving...' : hasExistingEmail ? 'Update Email' : 'Save Email'}
              </Button>
            </div>

            {validationError && (
              <div className="text-xs font-medium text-red-500">{validationError}</div>
            )}

            {message && (
              <div
                className={`text-xs font-medium ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {message.text}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
