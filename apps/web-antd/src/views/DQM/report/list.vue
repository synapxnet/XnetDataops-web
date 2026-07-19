<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, message } from 'ant-design-vue';
import { getQualityReports } from '../api/qualityReport';
import type { QualityReport } from '../api/types';

const loading = ref(false);
const dataList = ref<QualityReport[]>([]);

const columns = [
  { title: '规则ID', dataIndex: 'ruleId', key: 'ruleId', width: 100 },
  { title: '检测时间', dataIndex: 'checkTime', key: 'checkTime', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '总行数', dataIndex: 'totalRows', key: 'totalRows', width: 100 },
  { title: '失败行数', dataIndex: 'failedRows', key: 'failedRows', width: 100 },
  { title: '通过率(%)', dataIndex: 'passRate', key: 'passRate', width: 110 },
];

async function fetchList() {
  loading.value = true;
  try {
    const res = await getQualityReports();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取报告列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="检测报告">
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'status'">
            <Tag :color="(_record as any).status === 'passed' ? 'green' : 'red'">{{ (_record as any).status }}</Tag>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
