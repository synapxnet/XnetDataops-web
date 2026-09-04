import type {
  BrowserColumn,
  BrowserNamespace,
  BrowserQueryRequest,
  BrowserQueryResult,
  BrowserSource,
  BrowserTable,
} from './types';

import { dsmRequestClient } from '#/api/request';

/** 查询不含凭据的可浏览数据源。 */
export function getBrowserSources() {
  return dsmRequestClient.get<BrowserSource[]>('/browser/sources');
}

/** 查询数据源允许浏览的数据库或 Schema。 */
export function getBrowserNamespaces(sourceId: number) {
  return dsmRequestClient.get<BrowserNamespace[]>(
    `/browser/sources/${sourceId}/namespaces`,
  );
}

/** 查询选定命名空间的表和视图。 */
export function getBrowserTables(sourceId: number, namespace: string) {
  return dsmRequestClient.get<BrowserTable[]>(
    `/browser/sources/${sourceId}/tables`,
    { params: { namespace } },
  );
}

/** 查询选定表的字段结构。 */
export function getBrowserColumns(
  sourceId: number,
  namespace: string,
  tableName: string,
) {
  return dsmRequestClient.get<BrowserColumn[]>(
    `/browser/sources/${sourceId}/tables/${encodeURIComponent(tableName)}/columns`,
    { params: { namespace } },
  );
}

/** 查询选定表的有限行数预览。 */
export function previewBrowserTable(
  sourceId: number,
  namespace: string,
  tableName: string,
  limit = 100,
) {
  return dsmRequestClient.get<BrowserQueryResult>(
    `/browser/sources/${sourceId}/tables/${encodeURIComponent(tableName)}/preview`,
    { params: { namespace, limit } },
  );
}

/** 执行由服务端强制校验的单条只读查询。 */
export function executeBrowserQuery(
  sourceId: number,
  request: BrowserQueryRequest,
) {
  return dsmRequestClient.post<BrowserQueryResult>(
    `/browser/sources/${sourceId}/query`,
    request,
  );
}
