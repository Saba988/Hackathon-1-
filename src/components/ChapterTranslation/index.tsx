import React, { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import styles from './styles.module.css';

const ChapterTranslation: React.FC = () => {
  const { data: session } = authClient.useSession();
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Only show for logged-in users
  if (!session) {
    return null; 
  }

  const handleTranslate = async () => {
    setLoading(true);
    setExpanded(true);
    
    try {
      // Scrape content from the article
      const articleContent = document.querySelector('article')?.innerText || "";
      
      const response = await fetch('http://localhost:8000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: articleContent,
          target_language: "Urdu"
        })
      });

      if (!response.ok) throw new Error("Failed to translate content");
      
      const data = await response.json();
      setTranslation(data.translated_content);
    } catch (err) {
      console.error(err);
      setTranslation("Could not translate content at this time. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {!expanded ? (
        <button className={styles.translateBtn} onClick={handleTranslate}>
          🌐 Translate to Urdu
        </button>
      ) : (
        <div className={styles.translationBox}>
          <div className={styles.header}>
            <strong>Urdu Translation</strong>
            <button className={styles.closeBtn} onClick={() => setExpanded(false)}>Close</button>
          </div>
          <div className={styles.content}>
            {loading ? (
              <div className={styles.loading}>Translating content...</div>
            ) : (
              <div className={styles.text} style={{ whiteSpace: 'pre-wrap', fontFamily: 'sans-serif' }}>
                {translation}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterTranslation;
