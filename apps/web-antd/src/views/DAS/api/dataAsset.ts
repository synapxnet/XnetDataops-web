import type { AssetAccessRecord, AssetClassification, AssetStats, DataAsset } from './types';

import { dasRequestClient } from '#/api/request';

export function getAssets(domain?: string, category?: string) {
  return dasRequestClient.get<DataAsset[]>('/assets', { params: { domain, category } });
}

export function getAsset(id: number) {
  return dasRequestClient.get<DataAsset>(`/assets/${id}`);
}

export function createAsset(data: Partial<DataAsset>) {
  return dasRequestClient.post<DataAsset>('/assets', data);
}

export function updateAsset(id: number, data: Partial<DataAsset>) {
  return dasRequestClient.put<DataAsset>(`/assets/${id}`, data);
}

export function deleteAsset(id: number) {
  return dasRequestClient.delete(`/assets/${id}`);
}

export function getAccessRecords(assetId: number) {
  return dasRequestClient.get<AssetAccessRecord[]>(`/assets/${assetId}/access-records`);
}

export function createAccessRecord(assetId: number, data: Partial<AssetAccessRecord>) {
  return dasRequestClient.post(`/assets/${assetId}/access-records`, data);
}

export function getClassifications() {
  return dasRequestClient.get<AssetClassification[]>('/classifications');
}

export function createClassification(data: Partial<AssetClassification>) {
  return dasRequestClient.post<AssetClassification>('/classifications', data);
}

export function updateClassification(id: number, data: Partial<AssetClassification>) {
  return dasRequestClient.put<AssetClassification>(`/classifications/${id}`, data);
}

export function deleteClassification(id: number) {
  return dasRequestClient.delete(`/classifications/${id}`);
}

export function getAssetStats() {
  return dasRequestClient.get<AssetStats>('/assets/stats');
}
