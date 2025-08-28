import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { theme } from '@/components/theme';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, walletAddress }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-4 sm:px-6 py-4 border-b ${theme.cardBorder}`}>
          <h2 className={`text-lg font-medium ${theme.text} text-center`}>Your Agent Wallet</h2>
        </div>

        <div className="px-4 sm:px-6 py-6 space-y-4">
          {/* QR Code with Orange styling and logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-orange-50/60 dark:bg-orange-900/25 p-3 rounded-lg">
                <div className="flex items-center justify-center relative w-32 h-32">
                  <QRCode
                    value={walletAddress}
                    size={96}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    viewBox="0 0 96 96"
                    level="H"
                    fgColor="#ea580c"
                    bgColor="#ffffff"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full flex items-center justify-center shadow-sm p-1 w-6 h-6">
                      <img
                        src="/vincent-logos/orange-v-logo.svg"
                        alt="Vincent"
                        className="object-contain w-4 h-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address below QR code */}
            <p className={`text-xs ${theme.textMuted} font-mono break-all px-2`}>{walletAddress}</p>
          </div>

          {/* Copy Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(walletAddress);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`w-full ${theme.text} border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20`}
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy Address'}
          </Button>
        </div>

        <div className={`px-4 sm:px-6 py-3 border-t ${theme.cardBorder} text-center`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`${theme.text} hover:bg-white/10`}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
