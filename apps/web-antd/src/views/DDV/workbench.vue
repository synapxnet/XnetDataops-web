<script lang="ts" setup>
import type { CSSProperties } from 'vue';

import type {
  BrowserColumn,
  BrowserNamespace,
  BrowserQueryResult,
  BrowserSource,
  BrowserTable,
  QueryResultColumn,
} from './api/types';

import { computed, onMounted, ref } from 'vue';

import {
  ClearOutlined,
  CodeOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  TableOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Empty,
  Input,
  message,
  Select,
  SelectOption,
  Spin,
  Table,
  TabPane,
  Tabs,
  Tag,
  Textarea,
  theme,
  Tooltip,
} from 'ant-design-vue';

import {
  executeBrowserQuery,
  getBrowserColumns,
  getBrowserNamespaces,
  getBrowserSources,
  getBrowserTables,
  previewBrowserTable,
} from './api/dataBrowser';

type OutputView = 'columns' | 'preview' | 'query';

const { token } = theme.useToken();

const sources = ref<BrowserSource[]>([]);
const namespaces = ref<BrowserNamespace[]>([]);
const tables = ref<BrowserTable[]>([]);
const columns = ref<BrowserColumn[]>([]);
const selectedSourceId = ref<number>();
const selectedNamespace = ref<string>();
const selectedTable = ref<string>();
const tableSearch = ref('');
const sqlContent = ref('SELECT 1;');
const queryLimit = ref(500);
const activeOutput = ref<OutputView>('preview');
const previewResult = ref<BrowserQueryResult>();
const queryResult = ref<BrowserQueryResult>();
const queryError = ref('');
const catalogLoading = ref(false);
const tableLoading = ref(false);
const queryLoading = ref(false);

/** 根据当前主题生成 SQL 工作台使用的语义颜色。 */
const workbenchStyle = computed<CSSProperties>(() => ({
  '--workbench-accent': token.value.colorPrimary,
  '--workbench-bg': token.value.colorBgLayout,
  '--workbench-border': token.value.colorBorderSecondary,
  '--workbench-fill': token.value.colorFillQuaternary,
  '--workbench-surface': token.value.colorBgContainer,
  '--workbench-surface-elevated': token.value.colorBgElevated,
  '--workbench-text': token.value.colorText,
  '--workbench-text-muted': token.value.colorTextSecondary,
}));

/** 返回当前选择的数据源。 */
const selectedSource = computed(() =>
  sources.value.find((source) => source.id === selectedSourceId.value),
);

/** 返回经过关键词过滤的数据表目录。 */
const filteredTables = computed(() => {
  const keyword = tableSearch.value.trim().toLowerCase();
  if (!keyword) return tables.value;
  return tables.value.filter((table) =>
    `${table.name} ${table.remarks ?? ''}`.toLowerCase().includes(keyword),
  );
});

/** 返回编辑器当前关联的数据对象名称。 */
const selectedObjectName = computed(() => {
  if (!selectedTable.value) return 'SQL';
  return `${selectedNamespace.value}.${selectedTable.value}`;
});

/** 将预览结果字段转换为 Ant Design 表格列。 */
const previewTableColumns = computed(() =>
  toAntColumns(previewResult.value?.columns ?? []),
);

/** 将查询结果字段转换为 Ant Design 表格列。 */
const queryTableColumns = computed(() =>
  toAntColumns(queryResult.value?.columns ?? []),
);

/** 为预览数据生成稳定的前端行键。 */
const previewRows = computed(() =>
  withRowKeys(previewResult.value?.rows ?? []),
);

/** 为查询结果生成稳定的前端行键。 */
const queryRows = computed(() => withRowKeys(queryResult.value?.rows ?? []));

/** 将字段结构转换为可展示的数据行。 */
const columnRows = computed(() =>
  columns.value.map((column) => ({
    ...column,
    nullableLabel: column.nullable ? 'NULL' : 'NOT NULL',
  })),
);

const fieldTableColumns = [
  { title: '字段', dataIndex: 'name', key: 'name', width: 260 },
  { title: '类型', dataIndex: 'typeName', key: 'typeName', width: 180 },
  {
    title: '约束',
    dataIndex: 'nullableLabel',
    key: 'nullableLabel',
    width: 120,
  },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
];

const limitOptions = [100, 200, 500];

/** 将后端查询列转换为 Ant Design Table 列定义。 */
function toAntColumns(resultColumns: QueryResultColumn[]) {
  return resultColumns.map((column) => ({
    title: column.label,
    dataIndex: column.key,
    key: column.key,
    width: 180,
    ellipsis: true,
  }));
}

/** 为查询结果增加仅供前端表格使用的稳定行键。 */
function withRowKeys(rows: Array<Record<string, unknown>>) {
  return rows.map((row, index) => ({ ...row, __rowKey: index }));
}

/** 载入数据源并自动进入第一个可用数据源。 */
async function loadSources() {
  catalogLoading.value = true;
  try {
    sources.value = await getBrowserSources();
    if (sources.value.length > 0) {
      selectedSourceId.value = sources.value[0]?.id;
      await handleSourceChange(selectedSourceId.value);
    }
  } catch (error: any) {
    message.error(error?.message || '获取数据源失败');
  } finally {
    catalogLoading.value = false;
  }
}

/** 切换数据源并重置下游数据库、表和查询状态。 */
async function handleSourceChange(value?: unknown) {
  const sourceId = typeof value === 'number' ? value : undefined;
  selectedSourceId.value = sourceId;
  resetNamespaceState();
  if (!sourceId) return;
  catalogLoading.value = true;
  try {
    namespaces.value = await getBrowserNamespaces(sourceId);
    selectedNamespace.value = namespaces.value[0]?.name;
    if (selectedNamespace.value) {
      await handleNamespaceChange(selectedNamespace.value);
    }
  } catch (error: any) {
    message.error(error?.message || '获取数据库目录失败');
  } finally {
    catalogLoading.value = false;
  }
}

/** 切换数据库或 Schema 并加载对应表目录。 */
async function handleNamespaceChange(value?: unknown) {
  const namespace = typeof value === 'string' ? value : undefined;
  selectedNamespace.value = namespace;
  resetTableState();
  if (!selectedSourceId.value || !namespace) return;
  tableLoading.value = true;
  try {
    tables.value = await getBrowserTables(selectedSourceId.value, namespace);
    if (tables.value.length > 0) {
      await handleTableSelect(tables.value[0] as BrowserTable);
    }
  } catch (error: any) {
    message.error(error?.message || '获取表目录失败');
  } finally {
    tableLoading.value = false;
  }
}

/** 选择表后并行加载字段结构与数据预览。 */
async function handleTableSelect(table: BrowserTable) {
  if (!selectedSourceId.value || !selectedNamespace.value) return;
  selectedTable.value = table.name;
  activeOutput.value = 'preview';
  tableLoading.value = true;
  try {
    const [columnResult, previewResultValue] = await Promise.all([
      getBrowserColumns(
        selectedSourceId.value,
        selectedNamespace.value,
        table.name,
      ),
      previewBrowserTable(
        selectedSourceId.value,
        selectedNamespace.value,
        table.name,
      ),
    ]);
    columns.value = columnResult;
    previewResult.value = previewResultValue;
    sqlContent.value = defaultTableQuery(table.name);
    queryResult.value = undefined;
    queryError.value = '';
  } catch (error: any) {
    message.error(error?.message || '加载表数据失败');
  } finally {
    tableLoading.value = false;
  }
}

/** 重新加载当前数据库或 Schema 的表目录。 */
async function refreshCatalog() {
  await handleNamespaceChange(selectedNamespace.value);
}

/** 执行只读查询并切换到查询结果视图。 */
async function handleExecute() {
  if (!selectedSourceId.value || !selectedNamespace.value) {
    message.warning('请选择数据源和数据库');
    return;
  }
  if (!sqlContent.value.trim()) {
    return;
  }
  activeOutput.value = 'query';
  queryLoading.value = true;
  queryError.value = '';
  try {
    queryResult.value = await executeBrowserQuery(selectedSourceId.value, {
      namespace: selectedNamespace.value,
      sql: sqlContent.value,
      limit: queryLimit.value,
    });
  } catch (error: any) {
    queryResult.value = undefined;
    queryError.value = error?.message || '查询失败';
  } finally {
    queryLoading.value = false;
  }
}

/** 清空 SQL、查询结果和错误状态。 */
function clearQuery() {
  sqlContent.value = '';
  queryResult.value = undefined;
  queryError.value = '';
  activeOutput.value = 'query';
}

/** 根据数据库类型生成带安全标识符引号的表查询。 */
function defaultTableQuery(tableName: string) {
  if (selectedSource.value?.type === 'MYSQL') {
    return `SELECT * FROM \`${tableName}\` LIMIT 100;`;
  }
  return `SELECT * FROM "${selectedNamespace.value}"."${tableName}" LIMIT 100;`;
}

/** 重置数据库选择及全部下游展示状态。 */
function resetNamespaceState() {
  namespaces.value = [];
  selectedNamespace.value = undefined;
  resetTableState();
}

/** 重置表、字段、预览和查询结果状态。 */
function resetTableState() {
  tables.value = [];
  columns.value = [];
  selectedTable.value = undefined;
  previewResult.value = undefined;
  queryResult.value = undefined;
  queryError.value = '';
  tableSearch.value = '';
  activeOutput.value = 'preview';
}

onMounted(loadSources);
</script>

<template>
  <div class="sql-workbench-page" :style="workbenchStyle">
    <header class="workbench-header">
      <div class="workbench-title">
        <CodeOutlined />
        <h1>SQL 工作台</h1>
        <Tag color="green">只读</Tag>
      </div>

      <div class="context-controls">
        <Select
          v-model:value="selectedSourceId"
          class="source-select"
          :loading="catalogLoading"
          placeholder="数据源"
          size="small"
          @change="handleSourceChange"
        >
          <SelectOption
            v-for="source in sources"
            :key="source.id"
            :value="source.id"
          >
            {{ source.name }} / {{ source.type }}
          </SelectOption>
        </Select>
        <Select
          v-model:value="selectedNamespace"
          class="namespace-select"
          :disabled="!selectedSourceId"
          :loading="catalogLoading"
          placeholder="数据库 / Schema"
          size="small"
          @change="handleNamespaceChange"
        >
          <SelectOption
            v-for="namespace in namespaces"
            :key="namespace.name"
            :value="namespace.name"
          >
            {{ namespace.displayName }}
          </SelectOption>
        </Select>
        <span class="catalog-count">{{ tables.length }} 表</span>
        <Tooltip title="刷新">
          <Button
            :disabled="!selectedNamespace"
            :loading="tableLoading"
            type="text"
            @click="refreshCatalog"
          >
            <template #icon><ReloadOutlined /></template>
          </Button>
        </Tooltip>
      </div>
    </header>

    <Spin :spinning="catalogLoading">
      <div class="workbench-shell">
        <aside class="object-pane">
          <div class="pane-toolbar object-toolbar">
            <span class="pane-title"><DatabaseOutlined /> 数据对象</span>
            <span class="pane-count">{{ filteredTables.length }}</span>
          </div>
          <div class="object-filter">
            <Input
              v-model:value="tableSearch"
              allow-clear
              placeholder="搜索表"
              size="small"
            >
              <template #prefix><SearchOutlined /></template>
            </Input>
          </div>
          <div class="object-list" aria-label="数据表列表">
            <button
              v-for="table in filteredTables"
              :key="table.qualifiedName"
              class="object-row"
              :class="[{ active: selectedTable === table.name }]"
              type="button"
              @click="handleTableSelect(table)"
            >
              <TableOutlined />
              <span class="object-name">{{ table.name }}</span>
              <span class="object-type">{{ table.type }}</span>
            </button>
            <div v-if="filteredTables.length === 0" class="empty-pane">
              <Empty
                :description="false"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
          </div>
        </aside>

        <main class="main-pane">
          <section class="editor-pane">
            <div class="pane-toolbar editor-toolbar">
              <div class="editor-object" :title="selectedObjectName">
                <TableOutlined v-if="selectedTable" />
                <CodeOutlined v-else />
                <span>{{ selectedObjectName }}</span>
              </div>
              <div class="editor-actions">
                <Tooltip title="结果行数上限">
                  <Select
                    v-model:value="queryLimit"
                    class="limit-select"
                    size="small"
                  >
                    <SelectOption
                      v-for="limit in limitOptions"
                      :key="limit"
                      :value="limit"
                    >
                      {{ limit }} 行
                    </SelectOption>
                  </Select>
                </Tooltip>
                <Tooltip title="清空">
                  <Button type="text" @click="clearQuery">
                    <template #icon><ClearOutlined /></template>
                  </Button>
                </Tooltip>
                <Button
                  type="primary"
                  :disabled="
                    !selectedSourceId ||
                    !selectedNamespace ||
                    !sqlContent.trim()
                  "
                  :loading="queryLoading"
                  @click="handleExecute"
                >
                  <template #icon><PlayCircleOutlined /></template>
                  执行
                </Button>
              </div>
            </div>
            <Textarea
              v-model:value="sqlContent"
              class="sql-editor"
              spellcheck="false"
              @keydown.ctrl.enter.prevent="handleExecute"
            />
            <div v-if="queryError" class="query-error" role="alert">
              {{ queryError }}
            </div>
          </section>

          <section class="output-pane">
            <Tabs
              v-model:active-key="activeOutput"
              :animated="false"
              class="output-tabs"
            >
              <TabPane key="query" tab="查询结果">
                <div class="output-view">
                  <div v-if="queryResult" class="output-meta">
                    <span>{{ queryResult.rowCount }} 行</span>
                    <span>{{ queryResult.durationMs }} ms</span>
                    <Tag v-if="queryResult.truncated" color="orange">
                      已截断
                    </Tag>
                  </div>
                  <Table
                    v-if="queryResult?.columns.length"
                    :columns="queryTableColumns"
                    :data-source="queryRows"
                    :pagination="false"
                    :scroll="{ x: 'max-content', y: 260 }"
                    row-key="__rowKey"
                    size="small"
                  />
                  <div v-else class="empty-pane output-empty">
                    <Empty
                      :description="false"
                      :image="Empty.PRESENTED_IMAGE_SIMPLE"
                    />
                  </div>
                </div>
              </TabPane>

              <TabPane key="preview" tab="数据预览">
                <div class="output-view">
                  <div v-if="previewResult" class="output-meta">
                    <span>{{ previewResult.rowCount }} 行</span>
                    <span>{{ previewResult.durationMs }} ms</span>
                    <Tag v-if="previewResult.truncated" color="orange">
                      已截断
                    </Tag>
                  </div>
                  <Table
                    v-if="previewResult?.columns.length"
                    :columns="previewTableColumns"
                    :data-source="previewRows"
                    :loading="tableLoading"
                    :pagination="false"
                    :scroll="{ x: 'max-content', y: 260 }"
                    row-key="__rowKey"
                    size="small"
                  />
                  <div v-else class="empty-pane output-empty">
                    <Empty
                      :description="false"
                      :image="Empty.PRESENTED_IMAGE_SIMPLE"
                    />
                  </div>
                </div>
              </TabPane>

              <TabPane key="columns" tab="字段结构">
                <div class="output-view">
                  <div class="output-meta">
                    <span>{{ columns.length }} 字段</span>
                  </div>
                  <Table
                    v-if="columns.length > 0"
                    :columns="fieldTableColumns"
                    :data-source="columnRows"
                    :pagination="false"
                    :scroll="{ x: 720, y: 260 }"
                    row-key="name"
                    size="small"
                  />
                  <div v-else class="empty-pane output-empty">
                    <Empty
                      :description="false"
                      :image="Empty.PRESENTED_IMAGE_SIMPLE"
                    />
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </section>
        </main>
      </div>
    </Spin>
  </div>
</template>

<style scoped>
.sql-workbench-page {
  min-width: 0;
  padding: 12px;
  color: var(--workbench-text);
}

.workbench-header,
.workbench-title,
.context-controls,
.pane-toolbar,
.pane-title,
.editor-object,
.editor-actions,
.output-meta {
  display: flex;
  align-items: center;
}

.workbench-header {
  gap: 18px;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 2px 10px;
}

.workbench-title {
  flex: 0 0 auto;
  gap: 8px;
}

.workbench-title h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  letter-spacing: 0;
}

.context-controls {
  gap: 8px;
  justify-content: flex-end;
  min-width: 0;
}

.source-select {
  width: 270px;
}

.namespace-select {
  width: 280px;
}

.catalog-count,
.pane-count,
.object-type,
.output-meta {
  font-size: 12px;
  color: var(--workbench-text-muted);
}

.catalog-count {
  padding: 0 4px;
  white-space: nowrap;
}

.workbench-shell {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  height: calc(100dvh - 178px);
  min-height: 520px;
  max-height: 840px;
  overflow: hidden;
  background: var(--workbench-surface);
  border: 1px solid var(--workbench-border);
  border-radius: 6px;
}

.object-pane {
  display: grid;
  grid-template-rows: 42px 48px minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid var(--workbench-border);
}

.pane-toolbar {
  min-height: 42px;
  padding: 0 12px;
  border-bottom: 1px solid var(--workbench-border);
}

.object-toolbar {
  justify-content: space-between;
}

.pane-title {
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
}

.object-filter {
  padding: 9px 10px;
  border-bottom: 1px solid var(--workbench-border);
}

.object-list {
  min-height: 0;
  padding: 6px;
  overflow: auto;
}

.object-row {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 40px;
  padding: 6px 8px;
  color: var(--workbench-text);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}

.object-row:hover {
  background: var(--workbench-fill);
}

.object-row:active {
  transform: translateY(1px);
}

.object-row.active {
  color: var(--workbench-accent);
  background: color-mix(in srgb, var(--workbench-accent) 12%, transparent);
}

.object-name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.object-type {
  font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
  font-size: 10px;
}

.main-pane {
  display: grid;
  grid-template-rows: minmax(220px, 42%) minmax(0, 58%);
  min-width: 0;
  overflow: hidden;
}

.editor-pane {
  display: grid;
  grid-template-rows: 42px minmax(0, 1fr) auto;
  min-height: 0;
  overflow: hidden;
}

.editor-toolbar {
  justify-content: space-between;
}

.editor-object {
  gap: 7px;
  min-width: 0;
}

.editor-object span {
  overflow: hidden;
  font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-actions {
  flex: 0 0 auto;
  gap: 5px;
}

.limit-select {
  width: 84px;
}

.sql-editor {
  height: 100% !important;
  min-height: 0 !important;
  padding: 12px 14px;
  font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  color: var(--workbench-text);
  resize: none;
  background: var(--workbench-surface-elevated);
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.sql-editor:focus {
  box-shadow: inset 3px 0 0 var(--workbench-accent);
}

.query-error {
  padding: 7px 12px;
  font-size: 12px;
  line-height: 20px;
  color: #cf1322;
  background: color-mix(in srgb, #ff4d4f 8%, var(--workbench-surface));
  border-top: 1px solid color-mix(in srgb, #ff4d4f 30%, transparent);
}

.output-pane {
  min-height: 0;
  overflow: hidden;
  border-top: 1px solid var(--workbench-border);
}

.output-tabs {
  height: 100%;
}

.output-tabs :deep(.ant-tabs-nav) {
  min-height: 42px;
  padding: 0 12px;
  margin: 0;
}

.output-tabs :deep(.ant-tabs-tab) {
  padding: 10px 0;
  font-size: 13px;
}

.output-tabs :deep(.ant-tabs-content-holder),
.output-tabs :deep(.ant-tabs-content),
.output-tabs :deep(.ant-tabs-tabpane) {
  height: 100%;
  min-height: 0;
}

.output-view {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.output-meta {
  gap: 12px;
  min-height: 30px;
  padding: 4px 12px;
  background: var(--workbench-fill);
}

.empty-pane {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
}

.output-empty {
  height: calc(100% - 30px);
}

@media (max-width: 980px) {
  .workbench-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .context-controls {
    justify-content: flex-start;
  }

  .source-select,
  .namespace-select {
    width: min(42vw, 280px);
    min-width: 0;
  }

  .workbench-shell {
    height: calc(100dvh - 218px);
  }
}

@media (max-width: 760px) {
  .sql-workbench-page {
    padding: 8px;
  }

  .context-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto auto;
  }

  .source-select,
  .namespace-select {
    width: 100%;
  }

  .workbench-shell {
    display: block;
    height: auto;
    min-height: 0;
    max-height: none;
    overflow: visible;
  }

  .object-pane {
    height: 240px;
    border-right: 0;
    border-bottom: 1px solid var(--workbench-border);
  }

  .main-pane {
    display: block;
  }

  .editor-pane {
    height: 320px;
  }

  .output-pane {
    height: 420px;
  }

  .output-view {
    padding-right: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .object-row {
    transition: none;
  }
}
</style>
