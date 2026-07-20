export interface Workflow {
  id: number;
  uid: string;
  name: string;
  description: string;
  scheduleCron: string;
  status: string;
  dagJson: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: number;
  workflowId: number;
  nodeKey: string;
  nodeName: string;
  nodeType: string;
  configJson: string;
  positionX: number;
  positionY: number;
}

export interface WorkflowEdge {
  id: number;
  workflowId: number;
  sourceNodeKey: string;
  targetNodeKey: string;
}

export interface TaskInstance {
  id: number;
  uid: string;
  workflowId: number;
  status: string;
  triggerType: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface NodeInstance {
  id: number;
  taskInstanceId: number;
  nodeKey: string;
  status: string;
  startTime: string;
  endTime: string;
  logContent: string;
}
