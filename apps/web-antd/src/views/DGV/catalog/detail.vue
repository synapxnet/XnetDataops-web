<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Button, Space, Descriptions, DescriptionsItem, message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { getMetaTable, getColumns, getTableTags } from '../api/metaTable';
import type { MetaTable, MetaColumn, DataTag } from '../api/types';

const route = useRoute();
const router = useRouter();
const tableId = ref(Number(route.params.id));
const metaTable = ref<MetaTable | null>(null);
const columns = ref<MetaColumn[]>([]);
const tags = ref<DataTag[]>([]);

const columnDefs = [
  { title: '列名', dataIndex: 'columnName', key: 'columnName' },
  { title: '类型', dataIndex: 'columnType', key: 'columnType', width: 150 },
  { title: '可为空', dataIndex: 'isNullable', key: 'isNullable', width: 80 },
  { title: '主键', dataIndex: 'isPrimaryKey', key: 'isPrimaryKey', width: 80 },
  { title: '默认值', dataIndex: 'defaultValue', key: 'defaultValue', width: 120 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
];

onMounted(async () => {
  try {
    metaTable.value = await getMetaTable(tableId.value);
    columns.value = await getColumns(tableId.value);
    tags.value = await getTableTags(tableId.value);
  } catch (e: any) {
    message.error('加载表详情失败: ' + e.message);
  }
});
</script>

<template>
  <div class="p-4">
    <Card :title="`表详情 - ${metaTable?.tableName || ''}`">
      <template #extra><Button @click="router.back()">返回</Button></template>
      <Descriptions bordered v-if="metaTable" :column="2" class="mb-4">
        <DescriptionsItem label="Schema">{{ metaTable.schemaName }}</DescriptionsItem>
        <DescriptionsItem label="表名">{{ metaTable.tableName }}</DescriptionsItem>
        <DescriptionsItem label="类型">{{ metaTable.tableType }}</DescriptionsItem>
        <DescriptionsItem label="行数">{{ metaTable.rowCount }}</DescriptionsItem>
        <DescriptionsItem label="所有者">{{ metaTable.owner }}</DescriptionsItem>
        <DescriptionsItem label="最后同步">{{ metaTable.lastSyncAt }}</DescriptionsItem>
        <DescriptionsItem label="描述" :span="2">{{ metaTable.description }}</DescriptionsItem>
      </Descriptions>

      <div class="mb-4" v-if="tags.length > 0">
        <h4>标签:</h4>
        <Space>
          <Tag v-for="tag in tags" :key="tag.id" :color="tag.color">{{ tag.name }}</Tag>
        </Space>
      </div>

      <h4>列信息:</h4>
      <Table :columns="columnDefs" :data-source="columns" row-key="id" size="small">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'isNullable'">
            <Tag :color="(_record as any).isNullable ? 'green' : 'red'">{{ (_record as any).isNullable ? '是' : '否' }}</Tag>
          </template>
          <template v-if="column.key === 'isPrimaryKey'">
            <Tag v-if="(_record as any).isPrimaryKey" color="gold">PK</Tag>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
