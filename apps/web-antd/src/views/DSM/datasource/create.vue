<script lang="ts" setup>
const pageRequestState = pageState();
import { pageState } from '#/components/data-page/request-state';
import DataPage from '#/components/data-page/index.vue';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
  SelectOption,
  Space,
  Textarea,
} from 'ant-design-vue';

import {
  createDataSource,
  getDataSource,
  updateDataSource,
} from '../api/datasource';

const router = useRouter();
const route = useRoute();
const editId = ref<null | number>(null);

const formState = reactive({
  name: '',
  type: 'MYSQL',
  host: '',
  port: 3306,
  databaseName: '',
  username: '',
  encryptedPassword: '',
  connectionParams: '',
  description: '',
});

const dsTypes = [
  'MYSQL',
  'POSTGRESQL',
  'ORACLE',
  'HIVE',
  'KAFKA',
  'S3',
  'FTP',
  'API',
];

const connectionParamsPlaceholder =
  '{"passwordEnv":"XNET_DATASOURCE_RECOMMENDATION_PASSWORD","sslMode":"require","connectTimeoutSeconds":5}';

const defaultPorts: Record<string, number> = {
  MYSQL: 3306,
  POSTGRESQL: 5432,
  ORACLE: 1521,
  HIVE: 10_000,
  KAFKA: 9092,
  S3: 443,
  FTP: 21,
  API: 80,
};

/** 切换数据源类型并填充安全的默认端口和连接参数。 */
/** 更新类型相关的默认配置。 Update defaults associated with the selected type. */
function onTypeChange(value: unknown) {
  const val = typeof value === 'string' ? value : '';
  formState.port = defaultPorts[val] || 3306;
  if (val === 'POSTGRESQL' && !formState.connectionParams) {
    formState.connectionParams = JSON.stringify(
      {
        connectTimeoutSeconds: 5,
        passwordEnv: 'XNET_DATASOURCE_RECOMMENDATION_PASSWORD',
        sslMode: 'require',
      },
      null,
      2,
    );
  }
}

/** 校验并提交数据源新增或编辑请求。 */
/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (!formState.name || !formState.host) {
    message.error('名称和主机不能为空');
    return;
  }
  try {
    if (editId.value) {
      await updateDataSource(editId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createDataSource({ ...formState });
      message.success('创建成功');
    }
    router.push('/DSM/datasource/list');
  } catch (error: any) {
    message.error(`操作失败: ${error.message}`);
  }
}

/** 编辑页面加载时读取不包含密码的数据源详情。 */
onMounted(async () => {
  const id = route.query.id;
  if (id) {
    editId.value = Number(id);
    try {
      const ds = await getDataSource(editId.value);
      Object.assign(formState, ds);
    } catch {
      message.error('获取数据源详情失败');
    }
  }
});
</script>

<template>
  <DataPage
    :title="editId ? '编辑数据源' : '新建数据源'"
    description="配置连接地址和访问凭据，保存到当前组织。"
  >
    <Form
      class="datasource-form"
      :disabled="
        pageRequestState.writePending > 0 ||
        Object.keys(pageRequestState.failures).length > 0
      "
      layout="vertical"
    >
      <section
        class="datasource-group"
        aria-labelledby="datasource-basic-title"
      >
        <header>
          <h2 id="datasource-basic-title">基本信息</h2>
          <p>用于识别和管理此连接</p>
        </header>
        <div class="datasource-fields">
          <FormItem label="数据源名称" required
            ><Input
              v-model:value="formState.name"
              placeholder="请输入数据源名称"
          /></FormItem>
          <FormItem label="数据源类型" required>
            <Select v-model:value="formState.type" @change="onTypeChange"
              ><SelectOption v-for="t in dsTypes" :key="t" :value="t">{{
                t
              }}</SelectOption></Select
            >
          </FormItem>
          <FormItem class="datasource-field-wide" label="描述"
            ><Textarea
              v-model:value="formState.description"
              :rows="2"
              placeholder="数据源描述"
          /></FormItem>
        </div>
      </section>
      <section
        class="datasource-group"
        aria-labelledby="datasource-connection-title"
      >
        <header>
          <h2 id="datasource-connection-title">连接地址</h2>
          <p>主机、端口和目标数据库</p>
        </header>
        <div class="datasource-fields">
          <FormItem label="主机地址" required
            ><Input
              v-model:value="formState.host"
              placeholder="例如: 192.168.1.100"
          /></FormItem>
          <FormItem label="端口"
            ><InputNumber
              v-model:value="formState.port"
              :min="1"
              :max="65535"
              style="width: 100%"
          /></FormItem>
          <FormItem class="datasource-field-wide" label="数据库名"
            ><Input
              v-model:value="formState.databaseName"
              placeholder="数据库名称"
          /></FormItem>
        </div>
      </section>
      <section
        class="datasource-group"
        aria-labelledby="datasource-credentials-title"
      >
        <header>
          <h2 id="datasource-credentials-title">访问凭据</h2>
          <p>{{ editId ? '密码留空将保留原配置' : '用于访问目标数据源' }}</p>
        </header>
        <div class="datasource-fields">
          <FormItem label="用户名"
            ><Input v-model:value="formState.username" placeholder="连接用户名"
          /></FormItem>
          <FormItem :label="editId ? '密码（留空则保留）' : '密码'"
            ><Input
              v-model:value="formState.encryptedPassword"
              type="password"
              placeholder="优先使用下方 passwordEnv"
          /></FormItem>
        </div>
      </section>
      <section
        class="datasource-group"
        aria-labelledby="datasource-advanced-title"
      >
        <header>
          <h2 id="datasource-advanced-title">高级参数</h2>
          <p>环境凭据、超时和安全连接</p>
        </header>
        <div class="datasource-fields">
          <FormItem class="datasource-field-wide" label="受控连接参数 (JSON)"
            ><Textarea
              v-model:value="formState.connectionParams"
              :rows="4"
              :placeholder="connectionParamsPlaceholder"
              class="datasource-json"
          /></FormItem>
        </div>
      </section>
      <div class="datasource-form-footer">
        <span>保存到当前组织</span>
        <Space>
          <Button @click="router.back()">取消</Button>
          <Button
            :loading="pageRequestState.writePending > 0"
            type="primary"
            @click="handleSubmit"
            >{{ editId ? '保存修改' : '创建数据源' }}</Button
          >
        </Space>
      </div>
    </Form>
  </DataPage>
</template>

<style scoped>
.datasource-form {
  max-width: 1080px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.8);
  border-radius: var(--dataops-radius);
}
.datasource-group {
  display: grid;
  grid-template-columns: 164px minmax(0, 1fr);
  gap: 28px;
  padding: 22px 26px 4px;
  border-bottom: 1px solid hsl(var(--border) / 0.7);
}
.datasource-group header h2 {
  margin: 1px 0 7px;
  font-size: 14px;
  font-weight: 650;
}
.datasource-group header p {
  margin: 0;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1.7;
}
.datasource-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
  min-width: 0;
}
.datasource-field-wide {
  grid-column: 1 / -1;
}
.datasource-json {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
}
.datasource-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  position: sticky;
  bottom: 0;
  z-index: 2;
  padding: 14px 24px;
  background: hsl(var(--card));
  border-radius: 0 0 var(--dataops-radius) var(--dataops-radius);
}
.datasource-form-footer > span {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}
@media (max-width: 900px) {
  .datasource-group {
    grid-template-columns: 128px minmax(0, 1fr);
    gap: 20px;
    padding-inline: 20px;
  }
}
@media (max-width: 640px) {
  .datasource-group {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 18px 16px 0;
  }
  .datasource-group header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 12px;
  }
  .datasource-group header h2 {
    margin: 0;
  }
  .datasource-fields {
    grid-template-columns: 1fr;
  }
  .datasource-form-footer {
    padding: 12px 16px;
  }
  .datasource-form-footer > span {
    display: none;
  }
  .datasource-form-footer > .ant-space {
    margin-left: auto;
  }
}
</style>
