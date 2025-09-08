import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { theme } from '@/components/theme';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

const FAQItem: React.FC<{ item: FAQItem; isOpen: boolean; onToggle: () => void }> = ({
  item,
  isOpen,
  onToggle,
}) => {
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
          {item.answer.split('\n').map((line, index) => (
            <div key={index} className={index > 0 ? 'mt-2' : ''}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const FAQ: React.FC<FAQProps> = ({ items }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

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

  return (
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
          />
        ))}
      </div>
    </div>
  );
};
