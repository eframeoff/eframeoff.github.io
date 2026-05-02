import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ msg: '', err: false, visible: false });
  const timerRef = useRef(null);

  const showToast = useCallback((msg, err = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, err, visible: true });
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }, []);

  return { toast, showToast };
}
