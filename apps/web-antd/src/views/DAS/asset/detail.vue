<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Button, Descriptions, DescriptionsItem, message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { getAsset, getAccessRecords } from '../api/dataAsset';
import type { DataAsset, AssetAccessRecord } from '../api/types';

const route = useRoute();
const router = useRouter();
const assetId = ref(Number(route.params.id));
const asset = ref<DataAsset | null>(null);
const accessRecords = ref<AssetAccessRecord[]>([]);

const accessColumns = [
  { title: '访问类型', dataIndex: 'accessType', key: 'accessType', width: 120 },
  { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 100 },
  { title: '访问时间', dataIndex: 'accessTime', key: 'accessTime', width: 180 },
  { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 150 },
  { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
];

const accessTypeColorMap: Record<string, string> = {
  read: 'blue',
  write: 'orange',
  delete: 'red',
  export: 'green',
};

const statusColorMap: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  deprecated: 'red',
};

const accessLevelColorMap: Record<string, string> = {
  public: 'green',
  internal: 'blue',
  confidential: 'orange',
  restricted: 'red',
};

onMounted(async () => {
  try {
    asset.value = await getAsset(assetId.value);
    accessRecords.value = await getAccessRecords(assetId.value);
  } catch (e: any) {
    message.error('加载资产详情失败: ' + e.message);
  }
});
</script>

<template>
  <div class="p-4">
    <Card :title="`资产详情 - ${asset?.name || ''}`">
      <template #extra><Button @click="router.back()">返回</Button></template>
      <Descriptions bordered v-if="asset" :column="2" class="mb-4">
        <DescriptionsItem label="资产名称">{{ asset.name }}</DescriptionsItem>
        <DescriptionsItem label="UID">{{ asset.uid }}</DescriptionsItem>
        <DescriptionsItem label="资产类型">{{ asset.assetType }}</DescriptionsItem>
        <DescriptionsItem label="业务域">{{ asset.domain }}</DescriptionsItem>
        <DescriptionsItem label="分类">{{ asset.category }}</DescriptionsItem>
        <DescriptionsItem label="所有者">{{ asset.owner }}</DescriptionsItem>
        <DescriptionsItem label="访问级别">
          <Tag :color="accessLevelColorMap[asset.accessLevel] || 'default'">{{ asset.accessLevel }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Tag :color="statusColorMap[asset.status] || 'default'">{{ asset.status }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="关联表名">{{ asset.tableName }}</DescriptionsItem>
        <DescriptionsItem label="数据源ID">{{ asset.datasourceId }}</DescriptionsItem>
        <DescriptionsItem label="行数">{{ asset.rowCount?.toLocaleString() }}</DescriptionsItem>
        <DescriptionsItem label="数据大小">{{ asset.dataSizeBytes?.toLocaleString() }} Bytes</DescriptionsItem>
        <DescriptionsItem label="质量评分">{{ asset.qualityScore }}</DescriptionsItem>
        <DescriptionsItem label="最后采集时间">{{ asset.lastProfiledAt }}</DescriptionsItem>
        <DescriptionsItem label="创建者">{{ asset.createdBy }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ asset.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="描述" :span="2">{{ asset.description }}</DescriptionsItem>
      </Descriptions>

      <h4 class="mb-2">访问记录:</h4>
      <Table :columns="accessColumns" :data-source="accessRecords" row-key="id" size="small">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'accessType'">
            <Tag :color="accessTypeColorMap[(_record as any).accessType] || 'default'">{{ (_record as any).accessType }}</Tag>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
