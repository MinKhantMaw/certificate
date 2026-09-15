import { useCallback, useEffect, useState } from 'react';
import { Document } from '../types';
import { isPreviewDocument, requestEncryptedQr } from '../services/encryptLink';

export type EncryptedQrStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useEncryptedQr(document: Document, enabled = true) {
  const preview = isPreviewDocument(document);
  const cachedUrl = document.encryptedQrUrl || '';
  const previewUrl = document.verificationUrl || 'https://example.invalid/document-preview';
  const [url, setUrl] = useState(cachedUrl);
  const [status, setStatus] = useState<EncryptedQrStatus>(
    !enabled || preview ? 'idle' : cachedUrl ? 'ready' : 'loading',
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setUrl('');
      setStatus('idle');
      return;
    }
    if (preview) {
      setUrl(previewUrl);
      setStatus('ready');
      return;
    }
    if (cachedUrl) {
      setUrl(cachedUrl);
      setStatus('ready');
      return;
    }
    let active = true;
    setUrl('');
    setStatus('loading');
    requestEncryptedQr(document, { allowFallback: false })
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
  }, [document.id, cachedUrl, enabled, preview, previewUrl, attempt]);

  const retry = useCallback(() => {
    if (preview) return;
    setAttempt((value) => value + 1);
  }, [preview]);

  return { url, status, retry };
}
