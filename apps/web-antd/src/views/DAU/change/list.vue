<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted } from 'vue';
import { Table, Tag, Input, InputNumber, Space, message } from 'ant-design-vue';
import { getDataChanges } from '../api/audit';
import type { DataChangeRecord } from '../api/types';

const loading = ref(false);
const dataList = ref<DataChangeRecord[]>([]);
const filterDatasourceId = ref<number | undefined>(undefined);
const filterTableName = ref<string | undefined>(undefined);

const columns = [
  { title: '表名', dataIndex: 'tableName', key: 'tableName', width: 200 },
  { title: '变更类型', dataIndex: 'changeType', key: 'changeType', width: 120 },
  {
    title: '影响行数',
    dataIndex: 'affectedRows',
    key: 'affectedRows',
    width: 100,
  },
  {
    title: '变更SQL',
    dataIndex: 'changeSql',
    key: 'changeSql',
    ellipsis: true,
  },
  { title: '变更人', dataIndex: 'changedBy', key: 'changedBy', width: 120 },
  { title: '变更时间', dataIndex: 'changedAt', key: 'changedAt', width: 180 },
];

const changeTypeColorMap: Record<string, string> = {
  insert: 'green',
  update: 'blue',
  delete: 'red',
  truncate: 'orange',
  ddl: 'purple',
};

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
async function fetchList() {
  loading.value = true;
  try {
    const res = await getDataChanges(
      filterDatasourceId.value,
      filterTableName.value,
    );
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取数据变更记录失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 更新数据源筛选并查询。 Update the data source filter and reload. */
function handleDatasourceIdChange() {
  fetchList();
}

/** 按表名称筛选资料。 Filter records by table name. */
function handleTableNameSearch(value: string) {
  filterTableName.value = value || undefined;
  fetchList();
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <DataPage
    description="保留访问和变更轨迹，让合规过程可追溯。"
    title="数据变更记录"
  >
    <template #extra>
      <Space>
        <InputNumber
          v-model:value="filterDatasourceId"
          placeholder="数据源ID"
          style="width: 140px"
          @change="handleDatasourceIdChange"
        />
        <Input.Search
          v-model:value="filterTableName"
          placeholder="按表名筛选"
          allow-clear
          style="width: 200px"
          @search="handleTableNameSearch"
        />
      </Space>
    </template>
    <Table
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1000 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'changeType'">
          <Tag
            :color="
              changeTypeColorMap[(_record as any).changeType] || 'default'
            "
            >{{ (_record as any).changeType }}</Tag
          >
        </template>
      </template>
    </Table>
  </DataPage>
</template>
