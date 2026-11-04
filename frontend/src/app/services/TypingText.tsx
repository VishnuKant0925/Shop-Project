'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

// Decorative typewriter effect; the heading carries an sr-only text equivalent.
export default function TypingText({ words }: { words: string[] }) {
  const [activeWord, setActiveWord] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[activeWord];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      timeout = charIndex < currentWord.length
        ? setTimeout(() => setCharIndex(charIndex + 1), 70)
        : setTimeout(() => setIsDeleting(true), 2000);
    } else if (charIndex > 0) {
      timeout = setTimeout(() => setCharIndex(charIndex - 1), 35);
    } else {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setActiveWord((prev) => (prev + 1) % words.length);
      }, 0);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, activeWord, words]);

  return (
    <span className={styles.typingLine} aria-hidden="true">
      <span className={styles.typingText}>{words[activeWord].substring(0, charIndex)}</span>
      <span className={styles.typingCursor} />
    </span>
  );
}
