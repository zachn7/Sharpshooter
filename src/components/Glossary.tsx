import { useState } from 'react';
import type { GlossaryEntry } from '../data/glossary';
import { GLOSSARY_CATEGORIES, GLOSSARY_ENTRIES, getGlossarySearchResults } from '../data/glossary';

interface GlossaryProps {
  onClose: () => void;
  initialEntryId?: string;
}

export function Glossary({ onClose, initialEntryId }: GlossaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<GlossaryEntry | null>(
    initialEntryId ? GLOSSARY_ENTRIES.find((e) => e.id === initialEntryId) || null : null,
  );

  const filteredEntries = searchQuery
    ? getGlossarySearchResults(searchQuery)
    : selectedCategory
    ? GLOSSARY_ENTRIES.filter((e) => e.category === selectedCategory)
    : GLOSSARY_ENTRIES;

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, GlossaryEntry[]>);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998,
        }}
        data-testid="glossary-backdrop"
      />

      {/* Glossary drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '500px',
          height: '100vh',
          backgroundColor: '#ffffff',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.2)',
        }}
        data-testid="glossary-open"
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.5rem',
              color: '#1a1a2e',
            }}
          >
            Glossary
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              fontSize: '1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ✕
          </button>
        </div>

        {/* Search bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <input
            type="text"
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedCategory(null);
              setSelectedEntry(null);
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 1.5rem 1.5rem',
          }}
        >
          {/* Category filter (hide when searching) */}
          {!searchQuery && (
            <div
              style={{
                padding: '1rem 0',
                borderBottom: '1px solid #e0e0e0',
                marginBottom: '1rem',
              }}
            >
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  marginRight: '0.5rem',
                  marginBottom: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: selectedCategory === null ? '#0f3460' : '#e0e0e0',
                  color: selectedCategory === null ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                }}
              >
                All
              </button>
              {GLOSSARY_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    marginRight: '0.5rem',
                    marginBottom: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: selectedCategory === category ? '#0f3460' : '#e0e0e0',
                    color: selectedCategory === category ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Entry list selected state */}
          {selectedEntry ? (
            <div data-testid="glossary-entry">
              <button
                onClick={() => setSelectedEntry(null)}
                style={{
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'transparent',
                  color: '#0f3460',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ← Back
              </button>
              <h3
                style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.5rem',
                  color: '#1a1a2e',
                }}
              >
                {selectedEntry.term}
              </h3>
              <p
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#666',
                  fontStyle: 'italic',
                }}
              >
                {selectedEntry.shortDescription}
              </p>
              <p
                style={{
                  marginTop: '1rem',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: '#333',
                }}
              >
                {selectedEntry.description}
              </p>
            </div>
          ) : (
            <>
              {/* Grouped entries */}
              {Object.entries(groupedEntries).map(([category, entries]) => (
                <div key={category} style={{ marginBottom: '1.5rem' }}>
                  <h4
                    style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '1.125rem',
                      color: '#1a1a2e',
                    }}
                  >
                    {category}
                  </h4>
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem',
                        textAlign: 'left',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e9ecef';
                        e.currentTarget.style.borderColor = '#0f3460';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                    >
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: '500',
                          color: '#1a1a2e',
                        }}
                      >
                        {entry.term}
                      </div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          marginTop: '0.25rem',
                        }}
                      >
                        {entry.shortDescription}
                      </div>
                    </button>
                  ))}
                </div>
              ))}

              {/* No results */}
              {filteredEntries.length === 0 && (
                <p
                  style={{
                    textAlign: 'center',
                    color: '#666',
                    padding: '2rem',
                  }}
                >
                  No glossary entries found for "{searchQuery}"
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Glossary;
