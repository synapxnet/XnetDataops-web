<script lang="ts" setup>
const pageRequestState = pageState();
import { pageState } from '#/components/data-page/request-state';
import { useUserStore } from '@vben/stores';
import DataPage from '#/components/data-page/index.vue';
import { computed, ref, onMounted, onBeforeUnmount, reactive } from 'vue';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  FormItem,
  Input,
  InputPassword,
  Alert,
  DatePicker,
  Textarea,
  message,
} from 'ant-design-vue';
import { getKeys, createKey, revokeKey, deleteKey } from '../api/apiConfig';
import type { ApiKeySummary } from '../api/types';

const userStore = useUserStore();
const canManageKeys = computed(
  () =>
    (userStore.userInfo?.roles ?? []).some(
      (role) => role.toUpperCase() === 'ADMIN',
    ) || String(userStore.userInfo?.userType).toUpperCase() === 'ADMIN',
);
const createdCredential = ref<{ apiKey: string; secretKey: string } | null>(
  null,
);
const receiptVisible = ref(false);
/** 关闭一次性凭据回执时清除内存中的明文。 Clear plaintext from memory when closing the one-time credential receipt. */
function clearReceipt() {
  receiptVisible.value = false;
  createdCredential.value = null;
}
/** 根据用户明确点击复制刚创建的凭据，不写浏览器存储。 Copy newly created credentials on an explicit user action without browser persistence. */
async function copyCredential(field: 'apiKey' | 'secretKey') {
  try {
    await navigator.clipboard.writeText(createdCredential.value?.[field] ?? '');
    message.success('已复制');
  } catch {
    message.error('复制失败，请手动选择内容复制');
  }
}
onBeforeUnmount(clearReceipt);
const loading = ref(false);
const dataList = ref<ApiKeySummary[]>([]);

const columns = [
  { title: '应用名称', dataIndex: 'appName', key: 'appName' },
  { title: 'API Key', dataIndex: 'apiKey', key: 'apiKey' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '过期时间', dataIndex: 'expireAt', key: 'expireAt', width: 180 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  active: 'green',
  revoked: 'red',
  expired: 'default',
};

const statusLabelMap: Record<string, string> = {
  active: '有效',
  revoked: '已吊销',
  expired: '已过期',
};

/** 遮蔽密钥中间内容用于展示。 Mask the middle of a key for display. */
function maskKey(key: string) {
  if (!key) return '—';
  if (key.includes('•') || key.includes('*')) return key;
  if (key.length <= 8) return '••••';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

const modalVisible = ref(false);
const formState = reactive({
  appName: '',
  permissions: '',
  expireAt: '',
});

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
async function fetchList() {
  loading.value = true;
  try {
    const res = await getKeys();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取密钥列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 初始化新增草稿并打开表单。 Initialize a creation draft and open its form. */
function showCreate() {
  Object.assign(formState, { appName: '', permissions: '', expireAt: '' });
  modalVisible.value = true;
}

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (!canManageKeys.value || pageRequestState.writePending) return;
  if (formState.permissions.trim()) {
    try {
      JSON.parse(formState.permissions);
    } catch {
      message.error('权限需要有效JSON');
      return;
    }
  }
  if (!formState.appName) {
    message.error('应用名称不能为空');
    return;
  }
  try {
    const result = await createKey({ ...formState });
    if (!result.apiKey || !result.secretKey)
      throw new Error('服务端未返回新建凭据，请检查该密钥状态');
    createdCredential.value = {
      apiKey: result.apiKey,
      secretKey: result.secretKey,
    };
    receiptVisible.value = true;
    message.success('创建成功');
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  }
}

/** 撤销选中密钥并刷新列表。 Revoke the selected key and refresh the list. */
function handleRevoke(record: ApiKeySummary) {
  Modal.confirm({
    title: '确认吊销',
    content: `确定要吊销密钥「${record.appName}」吗？吊销后将无法使用。`,
    okType: 'danger',
    async onOk() {
      try {
        await revokeKey(record.id);
        message.success('吊销成功');
        fetchList();
      } catch (e: any) {
        message.error('吊销失败: ' + e.message);

        throw e;
      }
    },
  });
}

/** 确认后删除选中记录。 Delete the selected record after confirmation. */
function handleDelete(record: ApiKeySummary) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除密钥「${record.appName}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteKey(record.id);
        message.success('删除成功');
        fetchList();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);

        throw e;
      }
    },
  });
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <DataPage
    description="把可信数据转化为可管理的服务接口。"
    title="API密钥管理"
  >
    <template #extra>
      <Button type="primary" :disabled="!canManageKeys" @click="showCreate"
        >创建密钥</Button
      >
    </template>
    <Table
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1000 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'apiKey'">
          <span style="font-family: monospace">{{
            maskKey((_record as any).apiKey)
          }}</span>
        </template>
        <template v-if="column.key === 'status'">
          <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{
            statusLabelMap[(_record as any).status] || (_record as any).status
          }}</Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
            @click="handleRevoke(_record as ApiKeySummary)"
              :disabled="!canManageKeys || (_record as any).status !== 'active'"
              >吊销</Button
            >
            <Button
              type="link"
              size="small"
              danger
            @click="handleDelete(_record as ApiKeySummary)"
              :disabled="!canManageKeys"
              >删除</Button
            >
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      :mask-closable="false"
      :confirm-loading="pageRequestState.writePending > 0"
      v-model:open="modalVisible"
      title="创建密钥"
      @ok="handleSubmit"
      :destroy-on-close="true"
      width="500px"
    >
      <Form
        :disabled="
          pageRequestState.writePending > 0 ||
          Object.keys(pageRequestState.failures).length > 0
        "
        layout="vertical"
      >
        <FormItem label="应用名称" required>
          <Input
            v-model:value="formState.appName"
            placeholder="请输入应用名称"
          />
        </FormItem>
        <FormItem label="权限 (JSON)">
          <Textarea
            v-model:value="formState.permissions"
            :rows="3"
            placeholder='["read","write"]'
            style="font-family: monospace"
          />
        </FormItem>
        <FormItem label="过期时间">
          <DatePicker
            v-model:value="formState.expireAt"
            show-time
            placeholder="选择过期时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </FormItem>
      </Form>
    </Modal>
    <Modal
      :open="receiptVisible"
      title="保存新建凭据"
      :footer="null"
      :mask-closable="false"
      @cancel="clearReceipt"
      :after-close="clearReceipt"
      ><Alert
        message="请将凭据保存在应用的密钥配置中。关闭后本页不会再次显示完整内容。"
        type="info"
        show-icon
      />
      <div v-if="createdCredential" class="credential-receipt">
        <label>API Key</label
        ><InputPassword :value="createdCredential.apiKey" readonly /><Button
          @click="copyCredential('apiKey')"
          >复制 API Key</Button
        ><label>Secret Key</label
        ><InputPassword :value="createdCredential.secretKey" readonly /><Button
          @click="copyCredential('secretKey')"
          >复制 Secret Key</Button
        ><Button type="primary" @click="clearReceipt">已保存，关闭</Button>
      </div></Modal
    >
  </DataPage>
</template>

<style scoped>
.credential-receipt {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}
.credential-receipt label {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
</style>
