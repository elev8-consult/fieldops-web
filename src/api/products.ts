import { api } from '@/api/axios';
import { normalizeProduct, normalizeProductAlias } from '@/lib/normalize';
import type { Product, ProductAlias } from '@/types';

export interface ProductListParams {
  brand_id?: string;
  flow?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchProducts(
  params?: ProductListParams,
): Promise<Paginated<Product>> {
  const { data } = await api.get<Paginated<Record<string, unknown>>>(
    '/products',
    {
      params: {
        ...params,
        brand_id: params?.brand_id || undefined,
      },
    },
  );

  return {
    ...data,
    data: (data.data ?? []).map((row) => normalizeProduct(row)),
  };
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data } = await api.get<Record<string, unknown>>(`/products/${id}`);
  return normalizeProduct(data);
}

export async function createProduct(body: {
  brandId: string;
  canonicalName: string;
  sku?: string | null;
  flow: Product['flow'];
  unit?: string | null;
}): Promise<Product> {
  const { data } = await api.post<Record<string, unknown>>('/products', body);
  return normalizeProduct(data);
}

export async function updateProduct(
  id: string,
  body: Partial<{
    brandId: string;
    canonicalName: string;
    sku: string | null;
    flow: Product['flow'];
    unit: string | null;
    isActive: boolean;
  }>,
): Promise<Product> {
  const { data } = await api.patch<Record<string, unknown>>(
    `/products/${id}`,
    body,
  );
  return normalizeProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function fetchProductAliases(id: string): Promise<ProductAlias[]> {
  const { data } = await api.get<Record<string, unknown>[]>(
    `/products/${id}/aliases`,
  );
  return data.map((row) => normalizeProductAlias(row));
}

export async function addProductAlias(
  productId: string,
  alias: string,
): Promise<ProductAlias> {
  const { data } = await api.post<Record<string, unknown>>(
    `/products/${productId}/aliases`,
    { alias },
  );
  return normalizeProductAlias(data);
}

export async function deleteProductAlias(aliasId: string): Promise<void> {
  await api.delete(`/products/aliases/${aliasId}`);
}
