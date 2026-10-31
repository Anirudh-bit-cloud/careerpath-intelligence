import { useState, useEffect, useCallback } from 'react';
import { NAVIGATION_MAP } from '../navigation';

export interface RouteState {
  tab: string;
  params: Record<string, string>;
}

export function parseHash(hash: string): RouteState {
  const cleanHash = hash.replace(/^#\/?/, '').trim();
  if (!cleanHash) {
    return { tab: 'overview', params: {} };
  }

  const [pathPart, queryPart] = cleanHash.split('?');
  const tab = pathPart && NAVIGATION_MAP[pathPart] ? pathPart : 'overview';
  const params: Record<string, string> = {};

  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  return { tab, params };
}

export function formatHash(tab: string, params: Record<string, string> = {}): string {
  const cleanTab = tab || 'overview';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });

  const queryStr = searchParams.toString();
  return queryStr ? `#/${cleanTab}?${queryStr}` : `#/${cleanTab}`;
}

export function useUrlRoute(defaultTab: string = 'overview') {
  const [route, setRoute] = useState<RouteState>(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseHash(window.location.hash);
      return parsed.tab ? parsed : { tab: defaultTab, params: {} };
    }
    return { tab: defaultTab, params: {} };
  });

  // Keep document.title synchronized
  useEffect(() => {
    const navItem = NAVIGATION_MAP[route.tab];
    const pageTitle = navItem ? navItem.title : 'Intelligence';
    document.title = `${pageTitle} — CareerPath Intelligence`;
  }, [route.tab]);

  // Listen to browser navigation (back/forward) and direct hash change
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash(window.location.hash);
      setRoute(parsed);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // Initial check: if no hash in URL, set hash cleanly without reload
    if (!window.location.hash) {
      window.history.replaceState(null, '', formatHash(route.tab, route.params));
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigate = useCallback((tab: string, params: Record<string, string> = {}) => {
    const newHash = formatHash(tab, params);
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
      setRoute({ tab, params });
    }
  }, []);

  const setParams = useCallback((newParams: Record<string, string>, replace: boolean = true) => {
    setRoute((prev) => {
      const merged = { ...prev.params, ...newParams };
      // Clean empty keys
      Object.keys(merged).forEach((k) => {
        if (!merged[k]) delete merged[k];
      });
      const newHash = formatHash(prev.tab, merged);
      if (replace) {
        window.history.replaceState(null, '', newHash);
      } else {
        window.history.pushState(null, '', newHash);
      }
      return { tab: prev.tab, params: merged };
    });
  }, []);

  return {
    currentTab: route.tab,
    params: route.params,
    navigate,
    setParams
  };
}
