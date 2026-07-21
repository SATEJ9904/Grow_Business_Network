import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wraps a button handler so repeated taps within `cooldownMs` are ignored.
 * If the handler returns a promise, the guard stays locked until it settles
 * (plus the cooldown) so a slow network call can't be double-submitted by
 * impatient tapping. Safe to use on both async (network) and sync handlers.
 */
export function useGuardedAction(action, cooldownMs = 1200) {
  const lockedRef = useRef(false);
  const actionRef = useRef(action);
  actionRef.current = action;

  return useCallback(
    (...args) => {
      if (lockedRef.current) return undefined;
      lockedRef.current = true;

      const release = () => {
        setTimeout(() => {
          lockedRef.current = false;
        }, cooldownMs);
      };

      try {
        const result = actionRef.current(...args);
        if (result && typeof result.then === 'function') {
          result.then(release, release);
        } else {
          release();
        }
        return result;
      } catch (err) {
        release();
        throw err;
      }
    },
    [cooldownMs],
  );
}

/**
 * True once `active` (typically a `loading` flag) has stayed true continuously
 * for longer than `delayMs`. Meant to drive a "this is taking longer than
 * expected" notice *alongside* existing content/spinners - it never flips
 * content back to an error state itself, so it can't reproduce the
 * stale-closure bug where a one-shot timeout unconditionally overwrote an
 * already-successful screen. Resets automatically whenever `active` changes.
 */
export function useDelayedNotice(active, delayMs = 8000) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowNotice(false);
      return undefined;
    }
    setShowNotice(false);
    const timer = setTimeout(() => setShowNotice(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return showNotice;
}

/**
 * Turns a fetch/axios failure into a message a member can actually act on,
 * distinguishing "you're offline" from "the server said no" from "unknown".
 */
export function getFriendlyErrorMessage(
  error,
  fallback = 'Something went wrong. Please try again.',
) {
  if (!error) return fallback;

  const rawMessage = String(error.message || error);

  // React Native's fetch() throws a bare TypeError with one of these
  // messages when there is no route to the server at all (offline, DNS
  // failure, connection refused) - before a response is ever received.
  if (
    /network request failed/i.test(rawMessage) ||
    /failed to fetch/i.test(rawMessage)
  ) {
    return 'No internet connection. Please check your network and try again.';
  }

  if (error.name === 'AbortError' || /timeout/i.test(rawMessage)) {
    return 'The request timed out. Please check your connection and try again.';
  }

  // axios failures: no `response` means the request never reached the
  // server (offline/DNS/connection refused/timeout) rather than the server
  // returning an error status.
  if (error.isAxiosError) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'The request timed out. Please check your connection and try again.';
      }
      return 'No internet connection. Please check your network and try again.';
    }
    return error.response.data?.message || fallback;
  }

  return error.response?.data?.message || error.message || fallback;
}
