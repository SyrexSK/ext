import {
  API_BASE_URL_STORAGE_KEY,
  DEFAULT_API_BASE_URL,
} from '../constants';

const DEFAULT_RANCHER_CLUSTER_ID = 'local';

function buildRancherProxyBaseUrl(clusterId) {
  const normalizedClusterId = (clusterId || '').trim();
  const targetClusterId = !normalizedClusterId || normalizedClusterId === '_'
    ? DEFAULT_RANCHER_CLUSTER_ID
    : normalizedClusterId;

  return `/k8s/clusters/${ encodeURIComponent(targetClusterId) }/api/v1/namespaces/kubescape-outline-scanner/services/http:kubescape-outline-scanner:8080/proxy`;
}

function normalizeBaseUrl(value) {
  const trimmed = (value || '').trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/\/+$/, '');
}

export function getApiBaseUrl(clusterId) {
  if (typeof window === 'undefined') {
    return buildRancherProxyBaseUrl(clusterId);
  }

  const storedValue = normalizeBaseUrl(window.localStorage.getItem(API_BASE_URL_STORAGE_KEY));

  if (storedValue) {
    return storedValue;
  }

  return buildRancherProxyBaseUrl(clusterId);
}

export function setApiBaseUrl(value, clusterId) {
  if (typeof window !== 'undefined') {
    const normalizedValue = normalizeBaseUrl(value);

    if (normalizedValue) {
      window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalizedValue);
    } else {
      window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
    }
  }

  return getApiBaseUrl(clusterId);
}

async function request(path, options = {}, clusterId) {
  const response = await fetch(`${ getApiBaseUrl(clusterId) }${ path }`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(text || `Request failed with status ${ response.status }`);
  }

  return response.json();
}

export function fetchStatus(clusterId) {
  return request('/status', {}, clusterId);
}

export function fetchLatestReport(clusterId) {
  return request('/report/latest', {}, clusterId);
}

export function fetchHistory(limit = 20, clusterId) {
  return request(`/reports/history?limit=${ limit }`, {}, clusterId);
}

export function fetchStorageInfo(clusterId) {
  return request('/storage/info', {}, clusterId);
}

export function triggerScan(clusterId) {
  return request('/scan', {
    method: 'POST',
  }, clusterId);
}
