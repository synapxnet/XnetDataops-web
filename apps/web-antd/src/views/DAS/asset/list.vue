<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Button, Tag, Space, Select, SelectOption, Modal, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getAssets, deleteAsset } from '../api/dataAsset';
import type { DataAsset } from '../api/types';

const router = useRouter();
const loading = ref(false);
const dataList = ref<DataAsset[]>([]);
const filterDomain = ref<string | undefined>(undefined);
const filterCategory = ref<string | undefined>(undefined);

const columns = [
  { title: '资产名称', dataIndex: 'name', key: 'name' },
  { title: '资产类型', dataIndex: 'assetType', key: 'assetType', width: 100 },
  { title: '业务域', dataIndex: 'domain', key: 'domain', width: 100 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 80 },
  { title: '所有者', dataIndex: 'owner', key: 'owner', width: 100 },
  { title: '访问级别', dataIndex: 'accessLevel', key: 'accessLevel', width: 100 },
  { title: '质量评分', dataIndex: 'qualityScore', key: 'qualityScore', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const assetTypeColorMap: Record<string, string> = {
  table: 'blue',
  view: 'cyan',
  file: 'orange',
  api: 'purple',
  stream: 'green',
};

const categoryColorMap: Record<string, string> = {
  核心: 'red',
  重要: 'orange',
  一般: 'default',
};

const domainColorMap: Record<string, string> = {
  用户: 'blue',
  订单: 'green',
  财务: 'gold',
  运营: 'purple',
};

const accessLevelColorMap: Record<string, string> = {
  public: 'green',
  internal: 'blue',
  confidential: 'orange',
  restricted: 'red',
};

const statusColorMap: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  deprecated: 'red',
};

async function fetchList() {
  loading.value = true;
  try {
    const res = await getAssets(filterDomain.value, filterCategory.value);
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取资产列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function handleFilter() {
  fetchList();
}

function handleDelete(record: DataAsset) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除资产「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteAsset(record.id);
        message.success('删除成功');
        fetchList();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="数据资产列表">
      <template #extra>
        <Space>
          <Select v-model:value="filterDomain" placeholder="业务域" allow-clear style="width: 120px;" @change="handleFilter">
            <SelectOption value="用户">用户</SelectOption>
            <SelectOption value="订单">订单</SelectOption>
            <SelectOption value="财务">财务</SelectOption>
            <SelectOption value="运营">运营</SelectOption>
          </Select>
          <Select v-model:value="filterCategory" placeholder="分类" allow-clear style="width: 120px;" @change="handleFilter">
            <SelectOption value="核心">核心</SelectOption>
            <SelectOption value="重要">重要</SelectOption>
            <SelectOption value="一般">一般</SelectOption>
          </Select>
          <Button type="primary" @click="router.push('/DAS/asset/create')">新建资产</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1400 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'assetType'">
            <Tag :color="assetTypeColorMap[(_record as any).assetType] || 'default'">{{ (_record as any).assetType }}</Tag>
          </template>
          <template v-if="column.key === 'domain'">
            <Tag :color="domainColorMap[(_record as any).domain] || 'default'">{{ (_record as any).domain }}</Tag>
          </template>
          <template v-if="column.key === 'category'">
            <Tag :color="categoryColorMap[(_record as any).category] || 'default'">{{ (_record as any).category }}</Tag>
          </template>
          <template v-if="column.key === 'accessLevel'">
            <Tag :color="accessLevelColorMap[(_record as any).accessLevel] || 'default'">{{ (_record as any).accessLevel }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="router.push(`/DAS/asset/detail/${(_record as any).id}`)">详情</Button>
              <Button type="link" size="small" @click="router.push(`/DAS/asset/create?id=${(_record as any).id}`)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as DataAsset)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
