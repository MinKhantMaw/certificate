import { useCallback, useEffect, useState } from 'react';
import { Document } from '../types';
import { getOrCreateEncryptedQr, isPreviewDocument } from '../services/encryptLink';

export type EncryptedQrStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useEncryptedQr(document: Document) {
  const preview = isPreviewDocument(document);
  const cachedUrl = document.verificationUrl || '';
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
    getOrCreateEncryptedQr(document)
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
  }, [document.id, cachedUrl, preview, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { url, status, retry };
}
