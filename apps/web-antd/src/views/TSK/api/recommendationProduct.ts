import { tskRequestClient } from '#/api/request';

export interface RecommendationProduct {
  artifactDigestSha256: string;
  createdAt: string;
  lineageReference: string;
  negativeCount: number;
  positiveCount: number;
  productName: string;
  productVersion: string;
  publishedAt?: string;
  rowCount: number;
  schemaDigestSha256: string;
  status: 'building' | 'published' | 'retired' | 'validated';
}

export interface BuildRecommendationProductRequest {
  lineageReference: string;
  productVersion: string;
}

/** 查询 DataOps 已登记的全部推荐训练数据产品。 */
export function getRecommendationProducts() {
  return tskRequestClient.get<RecommendationProduct[]>('/recommendation-products');
}

/** 使用审批号和幂等键触发真实 PostgreSQL 数据聚合。 */
export function buildRecommendationProduct(
  data: BuildRecommendationProductRequest,
  approvalId: string,
  idempotencyKey: string,
) {
  return tskRequestClient.post<RecommendationProduct>('/recommendation-products/build', data, {
    headers: {
      'Idempotency-Key': idempotencyKey,
      'X-Approval-Id': approvalId,
    },
  });
}

/** 使用审批号和幂等键发布已通过验证的数据产品。 */
export function publishRecommendationProduct(
  productVersion: string,
  approvalId: string,
  idempotencyKey: string,
) {
  return tskRequestClient.post<RecommendationProduct>(
    `/recommendation-products/${encodeURIComponent(productVersion)}/publish`,
    undefined,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
        'X-Approval-Id': approvalId,
      },
    },
  );
}
