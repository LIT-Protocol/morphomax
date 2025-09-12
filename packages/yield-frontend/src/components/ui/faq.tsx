import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ImageIcon, X, Info } from 'lucide-react';
import { theme } from '@/components/theme';
import { env } from '@/config/env';

interface FAQItem {
  id: string;
  question: string;
  answer: string | React.ReactNode;
}

interface FAQProps {
  items: FAQItem[];
}

// Component for rendering withdraw funds FAQ
const WithdrawFundsAnswer: React.FC<{ onImageClick: (imagePath: string) => void }> = ({
  onImageClick,
}) => (
  <div className="space-y-2">
    <div className="flex items-start space-x-2">
      <div className="flex-1">
        <span className="text-[#FF4205] font-medium">1.</span> Click the red stop button above next
        to the word "Active"
      </div>
      <button
        onClick={() => onImageClick('/faq/faq-withdraw-1.png')}
        className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
        aria-label="View screenshot"
      >
        <ImageIcon className="w-4 h-4" style={{ color: '#FF4205' }} />
      </button>
    </div>
    <div>
      <span className="text-[#FF4205] font-medium">2.</span> Go to the{' '}
      <a
        href={`https://dashboard.heyvincent.ai/user/appId/${env.VITE_APP_ID}/wallet`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-baseline gap-0.5 underline hover:opacity-80"
        style={{ color: '#FF4205' }}
        title="Vincent WalletConnect"
      >
        <Info className="w-4 h-4" style={{ position: 'relative', top: '2px' }} />
        Vincent WalletConnect page
      </a>{' '}
      for this app
    </div>
    <div>
      <span className="text-[#FF4205] font-medium">3.</span> Use WalletConnect to connect to a
      wallet. There are some recommended ones on the WalletConnect page linked above.
    </div>
    <div>
      <span className="text-[#FF4205] font-medium">4.</span> Your USDC will be shown in the wallet,
      and you can use the wallet to send your USDC tokens wherever you want.
    </div>
    <div>
      <span className="text-[#FF4205] font-medium">5.</span> You may need to send a minimal amount
      of ETH for gas on Base to that wallet before you can send the USDC out.
    </div>
  </div>
);

export const faqData: FAQItem[] = [
  {
    id: 'what-is-vincent-yield',
    question: 'What is Vincent Yield?',
    answer:
      'Vincent Yield is an automated yield optimization platform that securely rotates your Base USDC into the highest-yielding vaults on Morpho every week.',
  },
  {
    id: 'withdraw-funds',
    question: 'How do I withdraw my funds?',
    answer: '',
  },
  {
    id: 'view-rewards',
    question: 'How can I view my rewards?',
    answer:
      'Your native stablecoin yield will auto-compound into your deposited balance. Rewards associated with the Lit Protocol points campaign will be allocated at a future snapshot and distributed at a later date.',
  },
];

const FAQItem: React.FC<{
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  onImageClick: (imagePath: string) => void;
}> = ({ item, isOpen, onToggle, onImageClick }) => {
  const renderAnswer = () => {
    // Special handling for withdraw-funds FAQ
    if (item.id === 'withdraw-funds') {
      return <WithdrawFundsAnswer onImageClick={onImageClick} />;
    }

    // For string answers, render as plain text (no dangerouslySetInnerHTML)
    if (typeof item.answer === 'string') {
      return <div>{item.answer}</div>;
    }

    // For React node answers
    return <div>{item.answer}</div>;
  };

  return (
    <div className={`border-b ${theme.cardBorder} last:border-b-0`}>
      <button
        onClick={onToggle}
        className={`w-full px-3 sm:px-6 py-4 text-left flex items-center justify-between ${theme.itemHoverBg} transition-colors`}
        aria-expanded={isOpen}
      >
        <span className={`${theme.text} text-sm font-medium pr-4`}>{item.question}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className={`px-3 sm:px-6 pb-4 ${theme.textMuted} text-sm leading-relaxed`}>
          {renderAnswer()}
        </div>
      )}
    </div>
  );
};

export const FAQ: React.FC<FAQProps> = ({ items }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [showImage, setShowImage] = useState<string | null>(null);

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleImageClick = (imagePath: string) => {
    setShowImage(imagePath);
  };

  const closeImageModal = () => {
    setShowImage(null);
  };

  return (
    <>
      <div className={`border-t ${theme.cardBorder}`}>
        <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
          <h3 className={`${theme.text} text-sm font-semibold`}>Frequently Asked Questions</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-white/10">
          {items.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              onImageClick={handleImageClick}
            />
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {showImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
          onClick={closeImageModal}
        >
          <div className="relative w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors z-10"
              aria-label="Close image"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <img
              src={showImage}
              alt="FAQ Screenshot"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
