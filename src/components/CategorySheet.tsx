'use client';

import React, { useState } from 'react';
import { AIRPORT_SENTENCES } from '../data/airportData';
import { CATEGORY_LABELS, type CategoryType } from '@/types/database';
import type { AirportSentence } from '@/types/database';

interface CategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sentence: AirportSentence) => void;
}

const CATEGORIES = (Object.keys(CATEGORY_LABELS) as CategoryType[]).map((id) => ({
  id,
  label: CATEGORY_LABELS[id],
}));

export function CategorySheet({ isOpen, onClose, onSelect }: CategorySheetProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('BOARDING');

  const filteredSentences = AIRPORT_SENTENCES.filter(
    (s) => s.category === activeCategory
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} aria-hidden="true" />
      <div className="sheet-container" role="dialog" aria-modal="true" aria-label="빠른 문장 선택">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <h2 className="sheet-title">📋 빠른 문장 선택</h2>
          <button id="sheet-close-btn" onClick={onClose} className="sheet-close-btn" aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="sheet-tabs" role="tablist">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`tab-${cat.id}`}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`sheet-tab ${activeCategory === cat.id ? 'sheet-tab--active' : ''}`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        <div className="sheet-sentences" role="tabpanel">
          {filteredSentences.map((item) => (
            <button
              key={item.id}
              id={`sentence-btn-${item.id}`}
              onClick={() => { onSelect(item as AirportSentence); onClose(); }}
              className="sentence-btn"
            >
              <div className="sentence-btn-content">
                <p className="sentence-korean">{item.sentence}</p>
                <p className="sentence-gloss">수어: {item.gloss_sentence}</p>
              </div>
              <span className="sentence-arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
