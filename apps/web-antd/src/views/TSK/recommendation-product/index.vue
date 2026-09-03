<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Descriptions,
  DescriptionsItem,
  Empty,
  Form,
  FormItem,
  Input,
  Modal,
  Progress,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  TypographyText,
  message,
} from 'ant-design-vue';
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';

import {
  buildRecommendationProduct,
  getRecommendationProducts,
  publishRecommendationProduct,
  type RecommendationProduct,
} from '../api/recommendationProduct';

const loading = ref(false);
const submitting = ref(false);
const products = ref<RecommendationProduct[]>([]);
const operationVisible = ref(false);
const operation = ref<'build' | 'publish'>('build');
const selectedProduct = ref<RecommendationProduct>();
const formState = reactive({
  approvalId: '',
  lineageReference: 'dataops://recommendation/raw/associated-sample-v1',
  productVersion: 'recommendation-dcn-demo-v1',
});

const columns = [
  { key: 'version', title: '数据产品版本', width: 260 },
  { key: 'status', title: '状态', width: 110 },
  { dataIndex: 'rowCount', key: 'rowCount', title: '记录数', width: 110 },
  { key: 'labels', title: '标签分布', width: 220 },
  { key: 'lineage', title: '血缘引用', width: 260 },
  { key: 'digest', title: '契约与制品摘要', width: 220 },
  { key: 'actions', title: '操作', width: 100, fixed: 'right' as const },
];

const latestProduct = computed(() => products.value[0]);
const publishedCount = computed(
  () => products.value.filter((product) => product.status === 'published').length,
);
const positiveRatio = computed(() => {
  const product = latestProduct.value;
  return product?.rowCount ? Math.round((product.positiveCount / product.rowCount) * 100) : 0;
});

/** 从后端加载真实数据产品列表。 */
async function loadProducts() {
  loading.value = true;
  try {
    products.value = await getRecommendationProducts();
  } catch (error: any) {
    message.error(`加载数据产品失败: ${error?.message || '未知错误'}`);
  } finally {
    loading.value = false;
  }
}

/** 打开构建数据产品的审批表单。 */
function openBuildDialog() {
  operation.value = 'build';
  selectedProduct.value = undefined;
  formState.approvalId = '';
  operationVisible.value = true;
}

/** 打开指定数据产品的发布审批表单。 */
function openPublishDialog(product: RecommendationProduct) {
  operation.value = 'publish';
  selectedProduct.value = product;
  formState.approvalId = '';
  formState.productVersion = product.productVersion;
  formState.lineageReference = product.lineageReference;
  operationVisible.value = true;
}

/** 生成一次性幂等键，防止按钮重复点击造成重复执行。 */
function createIdempotencyKey(action: string) {
  const entropy = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return `${action.toUpperCase()}-${entropy}`;
}

/** 校验审批表单并调用构建或发布接口。 */
async function submitOperation() {
  if (!formState.approvalId.trim()) {
    message.error('请输入审批号');
    return;
  }
  if (operation.value === 'build' && !formState.productVersion.trim()) {
    message.error('请输入数据产品版本');
    return;
  }
  submitting.value = true;
  try {
    if (operation.value === 'build') {
      await buildRecommendationProduct(
        {
          lineageReference: formState.lineageReference.trim(),
          productVersion: formState.productVersion.trim(),
        },
        formState.approvalId.trim(),
        createIdempotencyKey('build'),
      );
      message.success('聚合完成，数据产品已通过质量验证');
    } else if (selectedProduct.value) {
      await publishRecommendationProduct(
        selectedProduct.value.productVersion,
        formState.approvalId.trim(),
        createIdempotencyKey('publish'),
      );
      message.success('数据产品已发布，可由 XnetMLOps 导入');
    }
    operationVisible.value = false;
    await loadProducts();
  } catch (error: any) {
    message.error(`操作失败: ${error?.message || '未知错误'}`);
  } finally {
    submitting.value = false;
  }
}

/** 将记录数量格式化为适合表格扫描的本地数字。 */
function formatCount(value?: number) {
  return Number(value || 0).toLocaleString('zh-CN');
}

/** 将长摘要缩短显示，并保留完整内容供复制。 */
function shortDigest(value?: string) {
  return value ? `${value.slice(0, 10)}...${value.slice(-6)}` : '-';
}

/** 将数据产品状态映射为 Ant Design 语义颜色。 */
function statusColor(status: RecommendationProduct['status']) {
  return {
    building: 'processing',
    published: 'success',
    retired: 'default',
    validated: 'warning',
  }[status];
}

/** 将内部状态转换为中文展示文本。 */
function statusLabel(status: RecommendationProduct['status']) {
  return {
    building: '构建中',
    published: '已发布',
    retired: '已退役',
    validated: '已验证',
  }[status];
}

onMounted(loadProducts);
</script>

<template>
  <div class="product-page">
    <header class="page-header">
      <div>
        <h1>推荐数据产品</h1>
        <p>PostgreSQL 原始层经 DataOps 聚合、质量验证与审批后发布给 XnetMLOps。</p>
      </div>
      <Space>
        <Button :loading="loading" @click="loadProducts">
          <template #icon><ReloadOutlined /></template>
          刷新
        </Button>
        <Button type="primary" @click="openBuildDialog">
          <template #icon><DatabaseOutlined /></template>
          构建数据产品
        </Button>
      </Space>
    </header>

    <Alert
      class="boundary-alert"
      message="数据边界"
      description="页面不接触姓名、IP、设备标识与正文。训练记录使用一致性脱敏标识，并保留用户、内容、行为与标签关联。"
      show-icon
      type="info"
    />

    <section class="metric-band" aria-label="数据产品摘要">
      <Statistic title="最新版本" :value="latestProduct?.productVersion || '-'" />
      <Statistic title="训练记录" :value="formatCount(latestProduct?.rowCount)" />
      <Statistic title="正样本占比" :suffix="latestProduct ? '%' : ''" :value="positiveRatio" />
      <Statistic title="已发布版本" :value="publishedCount" />
    </section>

    <section class="table-section">
      <div class="section-heading">
        <div>
          <h2>版本与发布状态</h2>
          <p>摘要由服务端根据真实聚合结果计算，发布后不可覆盖。</p>
        </div>
      </div>

      <Table
        :columns="columns"
        :data-source="products"
        :loading="loading"
        :pagination="{ pageSize: 10, showSizeChanger: false }"
        :row-key="(record: RecommendationProduct) => record.productVersion"
        :scroll="{ x: 1280 }"
        size="middle"
      >
        <template #emptyText>
          <Empty description="尚未构建推荐数据产品" />
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'version'">
            <div class="version-cell">
              <strong>{{ record.productVersion }}</strong>
              <span>{{ record.productName }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</Tag>
          </template>
          <template v-else-if="column.key === 'rowCount'">
            <TypographyText strong>{{ formatCount(record.rowCount) }}</TypographyText>
          </template>
          <template v-else-if="column.key === 'labels'">
            <div class="label-distribution">
              <div>
                <span>正 {{ formatCount(record.positiveCount) }}</span>
                <span>负 {{ formatCount(record.negativeCount) }}</span>
              </div>
              <Progress
                :percent="Math.round((record.positiveCount / record.rowCount) * 100)"
                :show-info="false"
                :stroke-width="5"
              />
            </div>
          </template>
          <template v-else-if="column.key === 'lineage'">
            <Tooltip :title="record.lineageReference">
              <TypographyText class="lineage-text" copyable>{{ record.lineageReference }}</TypographyText>
            </Tooltip>
          </template>
          <template v-else-if="column.key === 'digest'">
            <div class="digest-cell">
              <TypographyText :copyable="{ text: record.schemaDigestSha256 }">
                Schema {{ shortDigest(record.schemaDigestSha256) }}
              </TypographyText>
              <TypographyText :copyable="{ text: record.artifactDigestSha256 }">
                制品 {{ shortDigest(record.artifactDigestSha256) }}
              </TypographyText>
            </div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button
              v-if="record.status === 'validated'"
              size="small"
              type="link"
              @click="openPublishDialog(record as RecommendationProduct)"
            >
              <template #icon><CloudUploadOutlined /></template>
              发布
            </Button>
            <Tooltip v-else-if="record.status === 'published'" title="该版本已发布给 XnetMLOps">
              <CheckCircleOutlined class="published-icon" />
            </Tooltip>
          </template>
        </template>
      </Table>
    </section>

    <Modal
      v-model:open="operationVisible"
      :confirm-loading="submitting"
      :title="operation === 'build' ? '构建推荐数据产品' : '发布到 XnetMLOps'"
      ok-text="确认执行"
      width="560px"
      @ok="submitOperation"
    >
      <Alert
        :message="operation === 'build' ? '写入级别 D2' : '发布级别 D3'"
        class="operation-alert"
        show-icon
        type="warning"
      />
      <Form layout="vertical">
        <FormItem label="数据产品版本" required>
          <Input v-model:value="formState.productVersion" :disabled="operation === 'publish'" />
        </FormItem>
        <FormItem v-if="operation === 'build'" label="血缘引用" required>
          <Input v-model:value="formState.lineageReference" />
        </FormItem>
        <FormItem label="审批号" required>
          <Input v-model:value="formState.approvalId" placeholder="例如 APR-20260827-001" />
        </FormItem>
      </Form>
      <Descriptions v-if="operation === 'publish' && selectedProduct" bordered size="small" :column="1">
        <DescriptionsItem label="记录数">{{ formatCount(selectedProduct.rowCount) }}</DescriptionsItem>
        <DescriptionsItem label="当前状态">{{ statusLabel(selectedProduct.status) }}</DescriptionsItem>
        <DescriptionsItem label="血缘">{{ selectedProduct.lineageReference }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<style scoped>
.product-page {
  max-width: 1480px;
  margin: 0 auto;
  padding: 24px;
}

.page-header,
.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.page-header h1,
.section-heading h2 {
  margin: 0;
  color: var(--ant-color-text);
  letter-spacing: 0;
}

.page-header h1 {
  font-size: 24px;
  line-height: 32px;
}

.section-heading h2 {
  font-size: 16px;
  line-height: 24px;
}

.page-header p,
.section-heading p {
  margin: 6px 0 0;
  color: var(--ant-color-text-secondary);
}

.boundary-alert {
  margin-top: 20px;
}

.metric-band {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 24px 0;
  padding: 20px 0;
  border-top: 1px solid var(--ant-color-border-secondary);
  border-bottom: 1px solid var(--ant-color-border-secondary);
}

.metric-band :deep(.ant-statistic) {
  min-width: 0;
  padding: 0 24px;
  border-right: 1px solid var(--ant-color-border-secondary);
}

.metric-band :deep(.ant-statistic:first-child) {
  padding-left: 0;
}

.metric-band :deep(.ant-statistic:last-child) {
  border-right: 0;
}

.metric-band :deep(.ant-statistic-content) {
  overflow: hidden;
  font-size: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-section {
  min-width: 0;
}

.section-heading {
  margin-bottom: 14px;
}

.version-cell,
.digest-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.version-cell span,
.digest-cell {
  color: var(--ant-color-text-secondary);
  font-size: 12px;
}

.label-distribution {
  width: 180px;
}

.label-distribution > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
  color: var(--ant-color-text-secondary);
  font-size: 12px;
}

.lineage-text {
  display: inline-block;
  max-width: 230px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

.published-icon {
  color: var(--ant-color-success);
  font-size: 18px;
}

.operation-alert {
  margin-bottom: 18px;
}

@media (max-width: 900px) {
  .product-page {
    padding: 16px;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .metric-band {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 20px;
  }

  .metric-band :deep(.ant-statistic:nth-child(2)) {
    border-right: 0;
  }
}

@media (max-width: 520px) {
  .metric-band {
    grid-template-columns: 1fr;
  }

  .metric-band :deep(.ant-statistic) {
    padding: 0;
    border-right: 0;
  }
}
</style>
