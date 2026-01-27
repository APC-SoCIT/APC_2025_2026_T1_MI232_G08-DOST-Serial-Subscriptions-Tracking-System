import React, { useState } from 'react';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Objects': ['📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '📁', '📂', '📄', '📃', '📑', '📊', '📈', '📉', '📋', '📌', '📍', '✂️', '📎', '🖇️', '📏', '📐', '✏️', '✒️', '🖊️', '🖋️', '📝'],
  'Symbols': ['✅', '❌', '❓', '❗', '⚠️', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🔶', '🔷', '🔸', '🔹', '▪️', '▫️', '◾', '◽', '⭐', '🌟', '✨', '💫', '🔔', '🔕'],
};

export default function EmojiPicker({ onSelect }) {
  const [activeCategory, setActiveCategory] = useState('Smileys');

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      width: '320px',
      overflow: 'hidden'
    }}>
      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e9ecef',
        overflowX: 'auto',
        padding: '8px 8px 0'
      }}>
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            style={{
              background: activeCategory === category ? '#e7f1ff' : 'transparent',
              border: 'none',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeCategory === category ? 600 : 400,
              color: activeCategory === category ? '#004A98' : '#6c757d',
              borderRadius: '6px 6px 0 0',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div style={{
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '4px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '22px',
              padding: '6px',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Quick Access Row */}
      <div style={{
        borderTop: '1px solid #e9ecef',
        padding: '8px 12px',
        display: 'flex',
        gap: '4px',
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        {['👍', '❤️', '😂', '😊', '🎉', '👏', '🔥', '✅'].map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px 6px',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
