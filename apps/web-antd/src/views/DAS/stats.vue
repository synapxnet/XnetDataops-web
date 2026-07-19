<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { Card, Row, Col, Statistic, Table, Tag, message } from 'ant-design-vue';
import { getAssetStats, getAssets } from './api/dataAsset';
import type { AssetStats, DataAsset } from './api/types';

const stats = ref<AssetStats | null>(null);
const assets = ref<DataAsset[]>([]);
const loading = ref(false);

const totalAssets = computed(() => assets.value.length);
const coreCount = computed(() => assets.value.filter(a => a.category === '核心').length);
const importantCount = computed(() => assets.value.filter(a => a.category === '重要').length);
const normalCount = computed(() => assets.value.filter(a => a.category === '一般').length);

const domainColumns = [
  { title: '业务域', dataIndex: 'domain', key: 'domain' },
  { title: '资产数量', dataIndex: 'count', key: 'count', width: 120 },
];

const accessLevelColumns = [
  { title: '访问级别', dataIndex: 'accessLevel', key: 'accessLevel' },
  { title: '资产数量', dataIndex: 'count', key: 'count', width: 120 },
];

const domainData = computed(() => {
  if (!stats.value?.byDomain) return [];
  return Object.entries(stats.value.byDomain).map(([domain, count]) => ({ domain, count }));
});

const accessLevelData = computed(() => {
  if (!stats.value?.byAccessLevel) return [];
  return Object.entries(stats.value.byAccessLevel).map(([accessLevel, count]) => ({ accessLevel, count }));
});

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

onMounted(async () => {
  loading.value = true;
  try {
    const [statsRes, assetsRes] = await Promise.all([getAssetStats(), getAssets()]);
    stats.value = statsRes as AssetStats;
    assets.value = Array.isArray(assetsRes) ? assetsRes : [];
  } catch (e: any) {
    message.error('加载统计数据失败: ' + e.message);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-4">
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card>
          <Statistic title="资产总数" :value="totalAssets" :loading="loading" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="核心资产" :value="coreCount" :loading="loading" value-style="color: #cf1322" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="重要资产" :value="importantCount" :loading="loading" value-style="color: #fa8c16" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="一般资产" :value="normalCount" :loading="loading" />
        </Card>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="12">
        <Card title="按业务域分布">
          <Table :columns="domainColumns" :data-source="domainData" :loading="loading" row-key="domain" :pagination="false" size="small">
            <template #bodyCell="{ column, record: _record }">
              <template v-if="column.key === 'domain'">
                <Tag :color="domainColorMap[(_record as any).domain] || 'default'">{{ (_record as any).domain }}</Tag>
              </template>
            </template>
          </Table>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="按访问级别分布">
          <Table :columns="accessLevelColumns" :data-source="accessLevelData" :loading="loading" row-key="accessLevel" :pagination="false" size="small">
            <template #bodyCell="{ column, record: _record }">
              <template v-if="column.key === 'accessLevel'">
                <Tag :color="accessLevelColorMap[(_record as any).accessLevel] || 'default'">{{ (_record as any).accessLevel }}</Tag>
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>
  </div>
</template>
