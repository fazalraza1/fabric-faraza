import { useCallback, useEffect, useRef, useState } from 'react';

export interface Identified { id: string }
export interface CrudApi<T extends Identified> {
  list(): Promise<T[]>;
  create(input: Omit<T, 'id'>): Promise<T>;
  update(id: string, patch: Partial<Omit<T, 'id'>>): Promise<T>;
  remove(id: string): Promise<void>;
}

export function useCrud<T extends Identified>(api: CrudApi<T>) {
  const [items, setItems] = useState<readonly T[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const apiRef = useRef(api);
  useEffect(() => { apiRef.current = api; }, [api]);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      setItems(await apiRef.current.list());
      setStatus('ready');
      setError(null);
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Unable to load records.');
    }
  }, []);

  useEffect(() => {
    // This stable callback performs the initial external data fetch once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: Omit<T, 'id'>) => {
    const optimistic = { ...input, id: `pending-${crypto.randomUUID()}` } as T;
    setItems((current) => [optimistic, ...current]);
    setPending(true);
    try {
      const saved = await apiRef.current.create(input);
      setItems((current) => current.map((item) => item.id === optimistic.id ? saved : item));
      setError(null);
    } catch (cause) {
      setItems((current) => current.filter((item) => item.id !== optimistic.id));
      setError(cause instanceof Error ? cause.message : 'Unable to create record.');
    } finally {
      setPending(false);
    }
  }, []);

  const update = useCallback(async (id: string, patch: Partial<Omit<T, 'id'>>) => {
    const previous = items;
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    setPending(true);
    try {
      const saved = await apiRef.current.update(id, patch);
      setItems((current) => current.map((item) => item.id === id ? saved : item));
      setError(null);
    } catch (cause) {
      setItems(previous);
      setError(cause instanceof Error ? cause.message : 'Unable to update record.');
    } finally {
      setPending(false);
    }
  }, [items]);

  const remove = useCallback(async (id: string) => {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    setPending(true);
    try {
      await apiRef.current.remove(id);
      setError(null);
    } catch (cause) {
      setItems(previous);
      setError(cause instanceof Error ? cause.message : 'Unable to delete record.');
    } finally {
      setPending(false);
    }
  }, [items]);

  return { items, status, error, pending, create, update, remove, refresh, clearError: () => setError(null) };
}
