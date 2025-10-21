import * as Sentry from '@sentry/react';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBackend } from '@/hooks/useBackend';
import { theme } from '@/components/theme';

const REFERRAL_SOURCES = ['Telegram', 'X (Twitter)', 'Galxe', 'Blog', 'Other'] as const;

type ReferralSource = {
  source: (typeof REFERRAL_SOURCES)[number];
  otherDetails?: string;
};

const MAX_OTHER_LENGTH = 100;

export const ReferralSourceForm: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<ReferralSource['source'] | null>(null);
  const [otherDetails, setOtherDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasExistingSource, setHasExistingSource] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { updateProfile, getProfile } = useBackend();

  // Fetch profile on mount
  useEffect(() => {
    const fetchReferralSource = async () => {
      try {
        const result = await getProfile();
        if (result?.referralSource) {
          setHasExistingSource(true);
        }
      } catch (error) {
        // 404 is expected when user hasn't set a source yet - silently ignore
        // But log other unexpected errors to Sentry
        if (error instanceof Error && !error.message.includes('404')) {
          Sentry.captureException(error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchReferralSource();
  }, [getProfile]);

  const validateForm = (): boolean => {
    if (!selectedSource) {
      setValidationError('Please select an option');
      return false;
    }
    if (selectedSource === 'Other' && !otherDetails.trim()) {
      setValidationError('Please provide details');
      return false;
    }
    if (selectedSource === 'Other' && otherDetails.length > MAX_OTHER_LENGTH) {
      setValidationError(`Maximum ${MAX_OTHER_LENGTH} characters allowed`);
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await updateProfile({
        referralSource: selectedSource!,
        referralOtherDetails: selectedSource === 'Other' ? otherDetails : undefined,
      });
      setMessage({ type: 'success', text: 'Thank you for letting us know!' });
      // Wait 2 seconds before hiding the form
      setTimeout(() => {
        setHasExistingSource(true);
      }, 2000);
    } catch (error) {
      Sentry.captureException(error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save response',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if user already submitted
  if (isLoading) {
    return (
      <div className="px-3 sm:px-6 py-4 animate-pulse">
        <div
          className={`h-4 ${theme.cardBorder} bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-2`}
        ></div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <div
            className={`h-8 ${theme.cardBorder} bg-gray-300 dark:bg-gray-700 rounded w-20`}
          ></div>
          <div
            className={`h-8 ${theme.cardBorder} bg-gray-300 dark:bg-gray-700 rounded w-24`}
          ></div>
          <div
            className={`h-8 ${theme.cardBorder} bg-gray-300 dark:bg-gray-700 rounded w-16`}
          ></div>
          <div
            className={`h-8 ${theme.cardBorder} bg-gray-300 dark:bg-gray-700 rounded w-14`}
          ></div>
          <div
            className={`h-8 ${theme.cardBorder} bg-gray-300 dark:bg-gray-700 rounded w-16`}
          ></div>
        </div>
      </div>
    );
  }

  if (hasExistingSource) {
    return null;
  }

  return (
    <div className="px-3 sm:px-6 py-4">
      <p className={`${theme.text} text-sm font-medium mb-2`}>
        How did you hear about Vincent Yield?
      </p>
      <form onSubmit={handleSubmit} noValidate className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {REFERRAL_SOURCES.map((source) => (
                <label
                  key={source}
                  className={`flex items-center gap-1 cursor-pointer ${theme.itemHoverBg} px-2 py-1.5 rounded transition-colors`}
                >
                  <input
                    type="radio"
                    name="referralSource"
                    value={source}
                    checked={selectedSource === source}
                    onChange={(e) => {
                      setSelectedSource(e.target.value as ReferralSource['source']);
                      setValidationError(null);
                      if (e.target.value !== 'Other') {
                        setOtherDetails('');
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-3 h-3 accent-[#FF4205] flex-shrink-0"
                  />
                  <span className={`${theme.text} text-xs whitespace-nowrap`}>{source}</span>
                </label>
              ))}
            </div>

            {selectedSource === 'Other' && (
              <div>
                <Input
                  type="text"
                  value={otherDetails}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue.length <= MAX_OTHER_LENGTH) {
                      setOtherDetails(newValue);
                      setValidationError(null);
                    }
                  }}
                  placeholder="Please specify..."
                  disabled={isSubmitting}
                  maxLength={MAX_OTHER_LENGTH}
                />
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  {otherDetails.length}/{MAX_OTHER_LENGTH} characters
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start">
            <Button
              type="submit"
              disabled={isSubmitting || !selectedSource}
              variant="primary"
              size="sm"
              className="w-full sm:w-auto py-1 px-2 text-xs h-auto"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
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
