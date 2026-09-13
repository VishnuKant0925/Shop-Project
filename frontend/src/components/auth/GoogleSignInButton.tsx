'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => Promise<void>;
  onError: (message: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme: 'outline'; size: 'large'; text: 'continue_with'; width: number }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';

export default function GoogleSignInButton({ onCredential, onError }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) {
            onError('Google did not return a sign-in credential. Please try again.');
            return;
          }
          await onCredential(credential);
        },
      });
      buttonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: Math.min(buttonRef.current.clientWidth || 360, 360),
      });
      setIsReady(true);
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.google) renderGoogleButton();
      else existingScript.addEventListener('load', renderGoogleButton, { once: true });
      return () => existingScript.removeEventListener('load', renderGoogleButton);
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = renderGoogleButton;
    script.onerror = () => onError('Google sign-in could not be loaded. Please try another login method.');
    document.head.appendChild(script);
    return () => script.removeEventListener('load', renderGoogleButton);
  }, [clientId, onCredential, onError]);

  if (!clientId) {
    return <p className="googleConfigurationHint">Google sign-in is not configured yet.</p>;
  }

  return (
    <div aria-busy={!isReady} className="googleSignInContainer" ref={buttonRef} />
  );
}
