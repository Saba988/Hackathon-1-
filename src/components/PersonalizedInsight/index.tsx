import React, { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import styles from './styles.module.css';

interface PersonalizedInsightProps {
  title?: string;
  defaultContent?: string;
  children?: React.ReactNode;
}

const PersonalizedInsight: React.FC<PersonalizedInsightProps> = ({ title, defaultContent }) => {
  const { data: session } = authClient.useSession();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // If not logged in, we don't show anything
  if (!session) {
    return null; 
  }

  const handlePersonalize = async () => {
    setLoading(true);
    setExpanded(true);
    
    try {
      // Scrape content or use default
      const articleElement = document.querySelector('article');
      const articleContent = articleElement?.innerText || defaultContent || 
        "This course covers Physical AI, Humanoid Robotics, ROS 2, Isaac Sim, and VLA models. It is a comprehensive guide to building intelligent robots.";
      
      const pageTitle = document.querySelector('h1')?.innerText || title || "Course Overview";
      
      // @ts-ignore
      const software = session.user?.software || "General";
      // @ts-ignore
      const hardware = session.user?.hardware || "General";

      const response = await fetch('http://localhost:8000/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_title: pageTitle,
          chapter_content: articleContent,
          software,
          hardware
        })
      });

      if (!response.ok) throw new Error("Failed to generate insight");
      
      const data = await response.json();
      setInsight(data.insight);
    } catch (err) {
      console.error(err);
      setInsight("Could not generate personal insights at this time. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const buttonText = (title === "Course Overview") 
    ? `✨ Personalize Course for ${session.user?.name?.split(' ')[0] || 'Me'}`
    : `✨ Personalize for ${session.user?.name?.split(' ')[0] || 'Me'}`;

  return (
    <div className={styles.container}>
      {!expanded ? (
        <button className={styles.personalizeBtn} onClick={handlePersonalize}>
          {buttonText}
        </button>
      ) : (
        <div className={styles.insightBox}>
          <div className={styles.header}>
            <strong>Personalized Insight</strong>
            <span className={styles.meta}>
              Using {
                // @ts-ignore
                session.user?.software
              } on {
                // @ts-ignore
                session.user?.hardware
              }
            </span>
          </div>
          <div className={styles.content}>
            {loading ? (
              <div className={styles.loading}>Analyzing chapter context...</div>
            ) : (
              <div className={styles.text}>{insight}</div>
            )}
          </div>
          <button className={styles.closeBtn} onClick={() => setExpanded(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default PersonalizedInsight;
