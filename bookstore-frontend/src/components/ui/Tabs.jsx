import React, { useState } from 'react';

/**
 * Tabs Component
 * Simple tab navigation
 */
const Tabs = ({ tabs = [], defaultTab = 0, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex border-b border-border dark:border-border gap-0">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            className={`px-4 py-3 font-medium text-body-sm border-b-2 transition-smooth ${
              activeTab === index
                ? 'border-primary text-primary dark:border-primary-light dark:text-primary-light'
                : 'border-transparent text-ink-muted hover:text-ink dark:text-ink-muted dark:hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default Tabs;
