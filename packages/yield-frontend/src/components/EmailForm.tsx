import * as Sentry from '@sentry/react';
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBackend } from '@/hooks/useBackend';
import { theme } from '@/components/theme';

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

// Cache to prevent refetching on remount
const emailCache = { email: '', hasExistingEmail: false, hasFetched: false };

export const EmailForm: React.FC = () => {
  const [email, setEmail] = useState(emailCache.email);
  const [savedEmail, setSavedEmail] = useState(emailCache.email);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasExistingEmail, setHasExistingEmail] = useState(emailCache.hasExistingEmail);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { submitEmail, getEmail } = useBackend();

  // Check if user already has an email on mount (only once globally)
  useEffect(() => {
    if (emailCache.hasFetched) return;

    const fetchEmail = async () => {
      try {
        const result = await getEmail();
        if (result?.email) {
          emailCache.email = result.email;
          emailCache.hasExistingEmail = true;
          setEmail(result.email);
          setSavedEmail(result.email);
          setHasExistingEmail(true);
        }
      } catch (error) {
        // 404 is expected when user hasn't set an email yet - silently ignore
        // But log other unexpected errors to Sentry
        if (error instanceof Error && !error.message.includes('404')) {
          Sentry.captureException(error);
        }
      } finally {
        emailCache.hasFetched = true;
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
      emailCache.email = email;
      emailCache.hasExistingEmail = true;
      setSavedEmail(email);
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
    <div className="px-3 sm:px-6 py-4">
      <p className={`${theme.text} text-sm font-medium mb-2`}>
        Want to receive updates about reward claiming?
      </p>
      {hasExistingEmail && (
        <p className={`text-xs ${theme.textMuted} mb-2`}>
          Current email: <span className={theme.text}>{savedEmail}</span>
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            variant="primary"
            size="sm"
            className="w-full sm:w-auto py-1 px-2 text-xs h-auto"
          >
            {isSubmitting ? 'Saving...' : hasExistingEmail ? 'Update' : 'Save'}
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
  );
};
