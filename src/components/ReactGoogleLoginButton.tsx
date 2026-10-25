'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Response contract modeled directly after `anthonyjgrove/react-google-login`
 * (https://github.com/anthonyjgrove/react-google-login)
 */
export interface GoogleProfileObj {
  googleId: string;
  imageUrl: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
}

export interface GoogleLoginResponse {
  googleId: string;
  tokenId: string;
  accessToken: string;
  profileObj: GoogleProfileObj;
  tokenObj?: {
    access_token: string;
    id_token: string;
    login_hint: string;
    scope: string;
    expires_in: number;
    first_issued_at: number;
    expires_at: number;
  };
  verifiedAdminUser?: unknown;
  isOAuthVerified?: boolean;
}

export interface ReactGoogleLoginProps {
  clientId?: string;
  buttonText?: string;
  onSuccess: (response: GoogleLoginResponse) => void;
  onFailure?: (error: { error: string; details?: string }) => void;
  onRequest?: () => void;
  theme?: 'light' | 'dark';
  disabled?: boolean;
  className?: string;
  lang?: 'ID' | 'EN';
  uxMode?: 'popup' | 'redirect';
  render?: (renderProps: {
    onClick: () => void;
    disabled?: boolean;
  }) => React.ReactElement;
}

export const ReactGoogleLoginButton: React.FC<ReactGoogleLoginProps> = ({
  clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  buttonText = 'Sign in with Google',
  onSuccess,
  onFailure,
  onRequest,
  theme = 'light',
  disabled = false,
  className = '',
  lang = 'ID',
  render,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const clearPopupPolling = useCallback(() => {
    if (pollTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !clientId) return;
    const existingScript = document.getElementById('google-gsi-client-script');
    if (existingScript) return;
    const script = document.createElement('script');
    script.id = 'google-gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'REACT_GOOGLE_LOGIN_SUCCESS' && data.payload) {
        clearPopupPolling();
        setIsLoading(false);
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        onSuccess(data.payload as GoogleLoginResponse);
      } else if (data.type === 'REACT_GOOGLE_LOGIN_FAILURE') {
        clearPopupPolling();
        setIsLoading(false);
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        onFailure?.({
          error: data.error || 'popup_closed_by_user',
          details: data.details,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearPopupPolling();
    };
  }, [clearPopupPolling, onFailure, onSuccess]);

  const signIn = useCallback(() => {
    if (disabled || isLoading) return;
    onRequest?.();
    setIsLoading(true);

    // If a real Google OAuth Client ID is loaded with Google Identity Services, use it
    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (
      clientId &&
      win?.google?.accounts?.oauth2?.initTokenClient
    ) {
      try {
        const tokenClient = win.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setIsLoading(false);
              onFailure?.({
                error: tokenResponse.error,
                details: tokenResponse.error_description,
              });
              return;
            }
            try {
              const userInfoRes = await fetch(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                  },
                }
              );
              const profile = await userInfoRes.json();
              const now = Date.now();
              const response: GoogleLoginResponse = {
                googleId: profile.sub || `gid_${now}`,
                tokenId: tokenResponse.access_token,
                accessToken: tokenResponse.access_token,
                profileObj: {
                  googleId: profile.sub || `gid_${now}`,
                  imageUrl: profile.picture || '',
                  email: profile.email || '',
                  name: profile.name || profile.email || '',
                  givenName: profile.given_name || profile.name || '',
                  familyName: profile.family_name || '',
                },
                tokenObj: {
                  access_token: tokenResponse.access_token,
                  id_token: tokenResponse.access_token,
                  login_hint: profile.email || '',
                  scope: 'openid email profile',
                  expires_in: Number(tokenResponse.expires_in) || 3599,
                  first_issued_at: now,
                  expires_at:
                    now + (Number(tokenResponse.expires_in) || 3599) * 1000,
                },
                isOAuthVerified: true,
              };
              setIsLoading(false);
              onSuccess(response);
            } catch (err) {
              setIsLoading(false);
              onFailure?.({
                error: 'network_error',
                details: String(err),
              });
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch {
        // Fall through to standalone OAuth popup window
      }
    }

    // Open centered OAuth popup window (uxMode="popup" in react-google-login)
    if (typeof window !== 'undefined') {
      const width = 460;
      const height = 620;
      const left = Math.max(
        0,
        Math.round(window.screenX + (window.outerWidth - width) / 2)
      );
      const top = Math.max(
        0,
        Math.round(window.screenY + (window.outerHeight - height) / 2)
      );

      const popupUrl = `/google-oauth-popup?lang=${lang}`;
      const popup = window.open(
        popupUrl,
        'react_google_login_popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=no,toolbar=no,menubar=no,location=no`
      );

      if (popup) {
        popupRef.current = popup;
        popup.focus();
        clearPopupPolling();
        pollTimerRef.current = window.setInterval(() => {
          if (!popupRef.current || popupRef.current.closed) {
            clearPopupPolling();
            setIsLoading(false);
          }
        }, 500);
        return;
      }
    }

    setIsLoading(false);
    onFailure?.({
      error: 'popup_blocked_by_browser',
      details: 'Browser blocked the Google OAuth popup window.',
    });
  }, [
    clearPopupPolling,
    clientId,
    disabled,
    isLoading,
    lang,
    onFailure,
    onRequest,
    onSuccess,
  ]);

  if (render) {
    return render({ onClick: signIn, disabled: disabled || isLoading });
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={disabled || isLoading}
      className={
        className ||
        `w-full h-11 px-4 rounded-lg font-sans font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer select-none shadow-2xs disabled:opacity-60 ${
          isDark
            ? 'bg-[#4285F4] hover:bg-[#3367D6] text-white border border-[#4285F4]'
            : 'bg-white hover:bg-[#F8FAFE] active:bg-[#F1F3F4] text-[#3c4043] border border-[#dadce0] hover:border-[#d2e3fc]'
        }`
      }
    >
      <span
        className={`w-5 h-5 rounded-xs flex items-center justify-center shrink-0 ${
          isDark ? 'bg-white p-0.5' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
          />
        </svg>
      </span>
      <span>
        {isLoading
          ? lang === 'ID'
            ? 'Menghubungkan ke Google...'
            : 'Connecting to Google...'
          : buttonText}
      </span>
    </button>
  );
};

export default ReactGoogleLoginButton;
