import { apiRequest } from "@/config/api/api";
import { File } from "expo-file-system";
import {
  FileSystemUploadType,
  createUploadTask,
} from "expo-file-system/legacy";
import type {
  Category,
  PaginatedResponse,
  Presentation,
  Product,
  ProductDetail,
} from "./productsTypes";

function localFile(uri: string, name: string, type: string) {
  const file = new File(uri);

  try {
    Object.defineProperty(file, "name", { value: name });
    Object.defineProperty(file, "type", { value: type });
  } catch {}
  return file as unknown as Blob;
}

export interface BusinessRequestContext {
  baseUrl: string;
  authorization: string;
}

export interface ProductChanges {
  name?: string;
  category?: number;
  type?: number;
  is_active?: boolean;
  is_archived?: boolean;
  display_on_store?: boolean;
  display_on_pos?: boolean;
  description?: string;
  sku?: string;
  iva_rate?: string;
  ieps_rate?: string;
}

const PAGE_SIZE = 20;

export function getProductsRequest(
  context: BusinessRequestContext,
  page: number,
) {
  return apiRequest<PaginatedResponse<Product>>(
    `/catalog/products/?page=${page}&items=${PAGE_SIZE}`,
    context,
  );
}

export function getCategoriesRequest(context: BusinessRequestContext) {
  return apiRequest<PaginatedResponse<Category>>(
    "/catalog/categories/?items=100",
    context,
  );
}

export interface ModelImage {
  id: number;
  model: number;
  url: string;
  public_url: string | null;
}

export function getModelImagesRequest(context: BusinessRequestContext) {
  return apiRequest<PaginatedResponse<ModelImage>>(
    "/catalog/product_models/images/?items=100",
    context,
  );
}

export function getModelsRequest(context: BusinessRequestContext) {
  return apiRequest<
    PaginatedResponse<{
      id: number;
      product: number | { id: number; name?: string };
      name: string;
    }>
  >("/catalog/product_models/?items=100", context);
}

export function getProductRequest(context: BusinessRequestContext, id: number) {
  return apiRequest<ProductDetail>(`/catalog/products/${id}/`, context);
}

export async function findPresentationByBarcode(
  context: BusinessRequestContext,
  barcode: string,
) {
  let page = 1;
  while (true) {
    const data = await apiRequest<PaginatedResponse<Presentation>>(
      `/catalog/presentations/?page=${page}&items=100`,
      context,
    );
    const match = data.results.find((p) => p.barcode?.trim() === barcode);
    if (match) return match;
    if (!data.next) return null;
    page += 1;
  }
}

export function createProductRequest(
  context: BusinessRequestContext,
  data: ProductChanges,
) {
  return apiRequest<{ id: number }>("/catalog/products/", {
    ...context,
    method: "POST",
    body: data,
  });
}

export function createCategoryRequest(
  context: BusinessRequestContext,
  name: string,
) {
  return apiRequest<Category>("/catalog/categories/", {
    ...context,
    method: "POST",
    body: { name },
  });
}

export function createModelRequest(
  context: BusinessRequestContext,
  product: number,
  name: string,
) {
  return apiRequest<{ id: number }>("/catalog/product_models/", {
    ...context,
    method: "POST",
    body: { product, name },
  });
}

export function createPresentationRequest(
  context: BusinessRequestContext,
  data: {
    product: number;
    model: number;
    name: string;
    cost: string;
    price: string;
    barcode?: string;
    is_active?: boolean;
    is_discount?: boolean;
    discount?: number;
    discount_store?: boolean;
    discount_pos?: boolean;
  },
) {
  return apiRequest<{ id: number }>("/catalog/presentations/", {
    ...context,
    method: "POST",
    body: data,
  });
}

export function updateModelRequest(
  context: BusinessRequestContext,
  id: number,
  changes: { name?: string; is_active?: boolean },
) {
  return apiRequest<unknown>(`/catalog/product_models/${id}/`, {
    ...context,
    method: "PATCH",
    body: changes,
  });
}

export function updatePresentationRequest(
  context: BusinessRequestContext,
  id: number,
  changes: Record<string, unknown>,
) {
  return apiRequest<unknown>(`/catalog/presentations/${id}/`, {
    ...context,
    method: "PATCH",
    body: changes,
  });
}

export function uploadModelImageRequest(
  context: BusinessRequestContext,
  modelId: number,
  photo: { uri: string; source: "device" | "url" | "existing" },
) {
  const form = new FormData();
  if (photo.source === "device") {
    const name = photo.uri.split("/").pop() ?? "foto.jpg";
    form.append("imgUploader", localFile(photo.uri, name, "image/jpeg"), name);
  } else {
    form.append("url", photo.uri);
  }
  return apiRequest<unknown>(`/catalog/product_models/${modelId}/image/`, {
    ...context,
    method: "PUT",
    body: form,
  });
}

export function updateProductRequest(
  context: BusinessRequestContext,
  id: number,
  changes: ProductChanges,
) {
  return apiRequest<unknown>(`/catalog/products/${id}/`, {
    ...context,
    method: "PATCH",
    body: changes,
  });
}

export interface CatalogFilter {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface CatalogLabel {
  id: number;
  name: string;
  filter: number;
  is_active?: boolean;
}

// Etiqueta aplicada a un producto.
export interface ProductFilterLink {
  id: number;
  product: number;
  filter: number;
  label: number;
}

export function getFiltersRequest(context: BusinessRequestContext) {
  return apiRequest<PaginatedResponse<CatalogFilter>>(
    "/catalog/filters/?items=100",
    context,
  );
}

export function getLabelsRequest(context: BusinessRequestContext) {
  return apiRequest<PaginatedResponse<CatalogLabel>>(
    "/catalog/labels/?items=200",
    context,
  );
}

export function createFilterRequest(
  context: BusinessRequestContext,
  name: string,
) {
  return apiRequest<CatalogFilter>("/catalog/filters/", {
    ...context,
    method: "POST",
    body: { name, is_active: true },
  });
}

export function createLabelRequest(
  context: BusinessRequestContext,
  filter: number,
  name: string,
) {
  return apiRequest<CatalogLabel>("/catalog/labels/", {
    ...context,
    method: "POST",
    body: { name, filter, is_active: true },
  });
}

export function createProductFilterRequest(
  context: BusinessRequestContext,
  data: { product: number; filter: number; label: number },
) {
  return apiRequest<ProductFilterLink>("/catalog/product_filters/", {
    ...context,
    method: "POST",
    body: data,
  });
}

export function deleteProductFilterRequest(
  context: BusinessRequestContext,
  id: number,
) {
  return apiRequest<unknown>(`/catalog/product_filters/${id}/`, {
    ...context,
    method: "DELETE",
  });
}

export interface ProductDocument {
  id: number;
  product: number;
  name: string;
  url?: string;
  public_url?: string;
  size_bytes?: number;
}

export function getDocumentsRequest(context: BusinessRequestContext) {
  return apiRequest<PaginatedResponse<ProductDocument>>(
    "/catalog/documents/?items=100",
    context,
  );
}

export function uploadDocumentRequest(
  context: BusinessRequestContext,
  product: number,
  file: { uri: string; name: string },
) {
  const form = new FormData();
  form.append("product", String(product));
  form.append("name", file.name);
  form.append(
    "file",
    localFile(file.uri, file.name, "application/pdf"),
    file.name,
  );
  return apiRequest<ProductDocument>("/catalog/documents/", {
    ...context,
    method: "POST",
    body: form,
  });
}

export function deleteDocumentRequest(
  context: BusinessRequestContext,
  id: number,
) {
  return apiRequest<unknown>(`/catalog/documents/${id}/`, {
    ...context,
    method: "DELETE",
  });
}

// La API no filtra por producto en estos listados: se traen y se filtran aquí.
export async function getProductFiltersRequest(
  context: BusinessRequestContext,
  product: number,
) {
  const page = await apiRequest<PaginatedResponse<ProductFilterLink>>(
    "/catalog/product_filters/?items=500",
    context,
  );
  return page.results.filter((link) => link.product === product);
}

export async function getProductDocumentsRequest(
  context: BusinessRequestContext,
  product: number,
) {
  const page = await getDocumentsRequest(context);
  return page.results.filter((doc) => doc.product === product);
}

export async function uploadModelImageWithProgress(
  context: BusinessRequestContext,
  modelId: number,
  photo: { uri: string; source: "device" | "url" | "existing" },
  onProgress: (fraction: number) => void,
) {
  if (photo.source !== "device") {
    await uploadModelImageRequest(context, modelId, photo);
    onProgress(1);
    return;
  }
  const task = createUploadTask(
    `${context.baseUrl}/catalog/product_models/${modelId}/image/`,
    photo.uri,
    {
      httpMethod: "PUT",
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: "imgUploader",
      mimeType: "image/jpeg",
      headers: {
        Authorization: context.authorization,
        Accept: "application/json",
      },
    },
    ({ totalBytesSent, totalBytesExpectedToSend }) => {
      if (totalBytesExpectedToSend > 0)
        onProgress(Math.min(totalBytesSent / totalBytesExpectedToSend, 0.99));
    },
  );
  let result;
  try {
    result = await task.uploadAsync();
  } catch {
    throw new Error("Sin conexión. Revisa tu internet e intenta nuevamente.");
  }
  if (!result || result.status >= 400) {
    let message = "No se pudo subir la foto.";
    try {
      const body = JSON.parse(result?.body ?? "{}");
      if (typeof body.detail === "string") message = body.detail;
      else if (typeof body.error === "string") message = body.error;
    } catch {}
    throw new Error(message);
  }
  onProgress(1);
}

export async function getModelImageListRequest(
  context: BusinessRequestContext,
  modelId: number,
) {
  const data = await apiRequest<ModelImage[] | PaginatedResponse<ModelImage>>(
    `/catalog/product_models/${modelId}/images/`,
    context,
  );
  return Array.isArray(data) ? data : data.results;
}

export function deleteModelImageRequest(
  context: BusinessRequestContext,
  modelId: number,
  imageId: number,
) {
  return apiRequest<unknown>(`/catalog/product_models/${modelId}/image/`, {
    ...context,
    method: "DELETE",
    body: { image_id: imageId },
  });
}

export function orderModelImagesRequest(
  context: BusinessRequestContext,
  modelId: number,
  order: number[],
) {
  return apiRequest<unknown>(
    `/catalog/product_models/${modelId}/images/order/`,
    {
      ...context,
      method: "PUT",
      body: { order },
    },
  );
}
