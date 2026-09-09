import { useCallback, useEffect, useState } from 'react';
import { Certificate } from '../types';
import { getOrCreateEncryptedQr, isPreviewCertificate } from '../services/encryptLink';

export type EncryptedQrStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useEncryptedQr(certificate: Certificate) {
  const preview = isPreviewCertificate(certificate);
  const cachedUrl = certificate.encryptedQrUrl || '';
  const [url, setUrl] = useState(cachedUrl);
  const [status, setStatus] = useState<EncryptedQrStatus>(
    preview ? 'idle' : cachedUrl ? 'ready' : 'loading',
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (preview) {
      setUrl('');
      setStatus('idle');
      return;
    }
    if (cachedUrl) {
      setUrl(cachedUrl);
      setStatus('ready');
      return;
    }
    let active = true;
    setStatus('loading');
    getOrCreateEncryptedQr(certificate)
      .then((encrypted) => {
        if (!active) return;
        setUrl(encrypted.qrUrl);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setUrl('');
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [certificate.id, cachedUrl, preview, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { url, status, retry };
}
