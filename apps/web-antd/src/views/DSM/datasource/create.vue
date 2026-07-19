<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Form, FormItem, Input, InputNumber, Select, SelectOption, Button, Textarea, Space, message } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue-router';
import { createDataSource, updateDataSource, getDataSource } from '../api/datasource';

const router = useRouter();
const route = useRoute();
const editId = ref<number | null>(null);

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

const dsTypes = ['MYSQL', 'POSTGRESQL', 'ORACLE', 'HIVE', 'KAFKA', 'S3', 'FTP', 'API'];

const defaultPorts: Record<string, number> = {
  MYSQL: 3306,
  POSTGRESQL: 5432,
  ORACLE: 1521,
  HIVE: 10000,
  KAFKA: 9092,
  S3: 443,
  FTP: 21,
  API: 80,
};

function onTypeChange(val: string) {
  formState.port = defaultPorts[val] || 3306;
}

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
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

onMounted(async () => {
  const id = route.query.id;
  if (id) {
    editId.value = Number(id);
    try {
      const ds = await getDataSource(editId.value);
      Object.assign(formState, ds);
    } catch (e: any) {
      message.error('获取数据源详情失败');
    }
  }
});
</script>

<template>
  <div class="p-4">
    <Card :title="editId ? '编辑数据源' : '新建数据源'">
      <Form layout="vertical" style="max-width: 600px;">
        <FormItem label="数据源名称" required>
          <Input v-model:value="formState.name" placeholder="请输入数据源名称" />
        </FormItem>
        <FormItem label="数据源类型" required>
          <Select v-model:value="formState.type" @change="onTypeChange">
            <SelectOption v-for="t in dsTypes" :key="t" :value="t">{{ t }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="主机地址" required>
          <Input v-model:value="formState.host" placeholder="例如: 192.168.1.100" />
        </FormItem>
        <FormItem label="端口">
          <InputNumber v-model:value="formState.port" :min="1" :max="65535" style="width: 100%;" />
        </FormItem>
        <FormItem label="数据库名">
          <Input v-model:value="formState.databaseName" placeholder="数据库名称" />
        </FormItem>
        <FormItem label="用户名">
          <Input v-model:value="formState.username" placeholder="连接用户名" />
        </FormItem>
        <FormItem label="密码">
          <Input v-model:value="formState.encryptedPassword" type="password" placeholder="连接密码" />
        </FormItem>
        <FormItem label="额外参数 (JSON)">
          <Textarea v-model:value="formState.connectionParams" :rows="3" placeholder='{"charset":"utf8mb4"}' />
        </FormItem>
        <FormItem label="描述">
          <Textarea v-model:value="formState.description" :rows="2" placeholder="数据源描述" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSubmit">{{ editId ? '更新' : '创建' }}</Button>
            <Button @click="router.back()">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
