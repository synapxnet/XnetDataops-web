<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  FormItem,
  Input,
  InputPassword,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getUserRoles,
} from '../api/user';
import type { User, UserRoleCluster } from '../api/types';

const loading = ref(false);
const users = ref<User[]>([]);

const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机', dataIndex: 'phone', key: 'phone', width: 130 },
  { title: '类型', dataIndex: 'userType', key: 'userType', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '最后登录', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 180 },
  { title: '操作', key: 'action', width: 280, fixed: 'right' as const },
];

const typeColorMap: Record<string, string> = {
  admin: 'red',
  user: 'blue',
};

const statusColorMap: Record<string, string> = {
  active: 'green',
  disabled: 'default',
};

// User form modal
const modalVisible = ref(false);
const modalTitle = ref('创建用户');
const editingId = ref<null | number>(null);
const formState = reactive({
  username: '',
  password: '',
  email: '',
  phone: '',
  userType: 'user',
  status: 'active',
});

// Password modal
const pwdModalVisible = ref(false);
const pwdUserId = ref<number>(0);
const pwdState = reactive({
  oldPassword: '',
  newPassword: '',
});

// Role view modal
const roleModalVisible = ref(false);
const roleModalTitle = ref('');
const userRoles = ref<UserRoleCluster[]>([]);
const roleLoading = ref(false);

const roleColumns = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
  { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode' },
];

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await getUsers();
    users.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取用户列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function showCreate() {
  editingId.value = null;
  modalTitle.value = '创建用户';
  formState.username = '';
  formState.password = '';
  formState.email = '';
  formState.phone = '';
  formState.userType = 'user';
  formState.status = 'active';
  modalVisible.value = true;
}

function showEdit(record: User) {
  editingId.value = record.id;
  modalTitle.value = '编辑用户';
  formState.username = record.username;
  formState.password = '';
  formState.email = record.email || '';
  formState.phone = record.phone || '';
  formState.userType = record.userType;
  formState.status = record.status;
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await updateUser(editingId.value, {
        email: formState.email,
        phone: formState.phone,
        userType: formState.userType,
        status: formState.status,
      });
      message.success('更新成功');
    } else {
      if (!formState.username || !formState.password) {
        message.error('用户名和密码不能为空');
        return;
      }
      await createUser({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchUsers();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDelete(record: User) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除用户「${record.username}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteUser(record.id);
        message.success('删除成功');
        fetchUsers();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

function showChangePwd(record: User) {
  pwdUserId.value = record.id;
  pwdState.oldPassword = '';
  pwdState.newPassword = '';
  pwdModalVisible.value = true;
}

async function handleChangePwd() {
  if (!pwdState.oldPassword || !pwdState.newPassword) {
    message.error('密码不能为空');
    return;
  }
  try {
    await changePassword(pwdUserId.value, pwdState.oldPassword, pwdState.newPassword);
    message.success('密码修改成功');
    pwdModalVisible.value = false;
  } catch (e: any) {
    message.error('修改失败: ' + e.message);
  }
}

async function showRoles(record: User) {
  roleModalTitle.value = `${record.username} - 角色`;
  roleModalVisible.value = true;
  roleLoading.value = true;
  try {
    const res = await getUserRoles(record.id);
    userRoles.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取角色失败: ' + e.message);
  } finally {
    roleLoading.value = false;
  }
}

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="p-4">
    <Card title="用户管理">
      <template #extra>
        <Button type="primary" @click="showCreate">创建用户</Button>
      </template>
      <Table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1100 }"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'userType'">
            <Tag :color="typeColorMap[(_record as any).userType] || 'default'">
              {{ (_record as any).userType }}
            </Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">
              {{ (_record as any).status }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showRoles(_record as User)">
                角色
              </Button>
              <Button type="link" size="small" @click="showEdit(_record as User)">
                编辑
              </Button>
              <Button type="link" size="small" @click="showChangePwd(_record as User)">
                改密
              </Button>
              <Button
                type="link"
                size="small"
                danger
                @click="handleDelete(_record as User)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Create/Edit User Modal -->
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      :destroy-on-close="true"
    >
      <Form layout="vertical">
        <FormItem label="用户名" required>
          <Input
            v-model:value="formState.username"
            :disabled="!!editingId"
            placeholder="用户名"
          />
        </FormItem>
        <FormItem v-if="!editingId" label="密码" required>
          <InputPassword v-model:value="formState.password" placeholder="密码" />
        </FormItem>
        <FormItem label="邮箱">
          <Input v-model:value="formState.email" placeholder="邮箱" />
        </FormItem>
        <FormItem label="手机">
          <Input v-model:value="formState.phone" placeholder="手机号" />
        </FormItem>
        <FormItem label="用户类型">
          <Select v-model:value="formState.userType">
            <SelectOption value="admin">管理员</SelectOption>
            <SelectOption value="user">普通用户</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="formState.status">
            <SelectOption value="active">启用</SelectOption>
            <SelectOption value="disabled">禁用</SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>

    <!-- Change Password Modal -->
    <Modal
      v-model:open="pwdModalVisible"
      title="修改密码"
      @ok="handleChangePwd"
      :destroy-on-close="true"
    >
      <Form layout="vertical">
        <FormItem label="旧密码" required>
          <InputPassword v-model:value="pwdState.oldPassword" placeholder="旧密码" />
        </FormItem>
        <FormItem label="新密码" required>
          <InputPassword v-model:value="pwdState.newPassword" placeholder="新密码" />
        </FormItem>
      </Form>
    </Modal>

    <!-- User Roles Modal -->
    <Modal
      v-model:open="roleModalVisible"
      :title="roleModalTitle"
      :footer="null"
      width="500px"
    >
      <Table
        :columns="roleColumns"
        :data-source="userRoles"
        :loading="roleLoading"
        row-key="id"
        size="small"
      />
    </Modal>
  </div>
</template>
