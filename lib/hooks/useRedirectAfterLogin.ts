import { useLocalStorage } from 'usehooks-ts';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useRedirectAfterLogin() {
  const [redirectUrl, setRedirectUrl] = useLocalStorage<string | null>('redirectAfterLogin', null);
  const router = useRouter();

  const saveRedirectUrl = useCallback((url: string) => {
    setRedirectUrl(url);
  }, [setRedirectUrl]);

  const clearAndRedirect = useCallback(() => {
    const urlReturnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    const targetUrl = urlReturnUrl || redirectUrl || '/social/feed';
    
    // Clear the stored redirect URL
    setRedirectUrl(null);
    
    // Navigate to target URL
    router.push(targetUrl);
    
    return targetUrl;
  }, [redirectUrl, setRedirectUrl, router]);

  return {
    redirectUrl,
    saveRedirectUrl,
    clearAndRedirect
  };
}