<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getMetaTables, deleteMetaTable } from '../api/metaTable';
import type { MetaTable } from '../api/types';

const router = useRouter();
const loading = ref(false);
const dataList = ref<MetaTable[]>([]);

const columns = [
  { title: '表名', dataIndex: 'tableName', key: 'tableName' },
  { title: 'Schema', dataIndex: 'schemaName', key: 'schemaName', width: 120 },
  { title: '类型', dataIndex: 'tableType', key: 'tableType', width: 80 },
  { title: '行数', dataIndex: 'rowCount', key: 'rowCount', width: 100 },
  { title: '所有者', dataIndex: 'owner', key: 'owner', width: 100 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '最后同步', dataIndex: 'lastSyncAt', key: 'lastSyncAt', width: 180 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const },
];

async function fetchList() {
  loading.value = true;
  try {
    const res = await getMetaTables();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取数据目录失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function handleDelete(record: MetaTable) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除表「${record.tableName}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteMetaTable(record.id); message.success('删除成功'); fetchList(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="数据目录">
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'tableType'">
            <Tag :color="(_record as any).tableType === 'table' ? 'blue' : 'green'">{{ (_record as any).tableType }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="router.push(`/DGV/catalog/detail/${(_record as any).id}`)">详情</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as MetaTable)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
