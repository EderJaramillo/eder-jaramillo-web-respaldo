import { logout } from "@/features/auth/authSlice";
import { getBusinessContext } from "@/features/business/businessContext";
import type { RootState } from "@/store/store";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { extractImageUrls, resolveImageUrl } from "./productImages";
import {
  createCategoryRequest,
  createFilterRequest,
  createLabelRequest,
  createModelRequest,
  createPresentationRequest,
  createProductFilterRequest,
  createProductRequest,
  deleteDocumentRequest,
  deleteModelImageRequest,
  deleteProductFilterRequest,
  findPresentationByBarcode,
  getFiltersRequest,
  getLabelsRequest,
  getModelImageListRequest,
  getModelImagesRequest,
  getModelsRequest,
  getProductDocumentsRequest,
  getProductFiltersRequest,
  getProductRequest,
  orderModelImagesRequest,
  updateModelRequest,
  updatePresentationRequest,
  updateProductRequest,
  uploadDocumentRequest,
  uploadModelImageWithProgress,
  type BusinessRequestContext,
  type CatalogFilter,
  type CatalogLabel,
} from "./productsApi";
import { MODELS_TYPE, SIMPLE_TYPE, type Category } from "./productsTypes";

export const MAX_PHOTOS = 5;

export interface DraftPhoto {
  key: string;
  uri: string;
  uploaded: boolean;
  // Id de la foto en el servidor
  imageId?: number | null;
}

// Una variante
export interface DraftVariant {
  key: string;
  presentationId: number | null;
  name: string;
  cost: string;
  price: string;
  isActive: boolean;
  barcode: string;
  offer: Offer;
}

export interface Offer {
  discount: string;
  onStore: boolean;
  onPos: boolean;
}

export const NO_OFFER: Offer = { discount: "", onStore: true, onPos: false };

export const hasOffer = (offer: Offer) => Number(offer.discount) > 0;

// Para una oferta hay que elegir al menos un canal.
export const isOfferValid = (offer: Offer) =>
  !hasOffer(offer) ||
  (Number(offer.discount) <= 100 && (offer.onStore || offer.onPos));

export const emptyVariant = (
  name = "",
  cost = "",
  price = "",
): DraftVariant => ({
  key: newKey("variant"),
  presentationId: null,
  name,
  cost,
  price,
  isActive: true,
  barcode: "",
  offer: NO_OFFER,
});

export type BarcodeTarget = "simple" | "variant";

export interface DraftModel {
  key: string;
  modelId: number | null;
  name: string;
  isActive: boolean;
  photos: DraftPhoto[];
  variants: DraftVariant[];
  // Fotos que ya estaban en el servidor al abrir el modelo, tambien se pueden modificar
  savedImageIds?: number[];
}

export interface UploadItem {
  key: string;
  uri: string;
  source: DraftPhoto["source"];
  label: string;
  modelKey: string;
  modelId: number;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
}

export interface SavedImage {
  url: string;
  modelName: string;
  productName: string;
}

export interface SavedDocument {
  id: number;
  name: string;
  sizeBytes: number;
}

// PDF's
export interface DocumentItem {
  key: string;
  id: number | null;
  uri: string | null;
  name: string;
  sizeBytes: number;
}

export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

export const IVA_OPTIONS = ["0", "8", "16"];
export const IEPS_OPTIONS = ["0", "8", "9", "26.5"];

// La API guarda la tasa como decimal en texto. Se manda como porcentaje ("16.00").
// Pendiente de confirmar con backend.
const toApiRate = (percent: string) => Number(percent || 0).toFixed(2);

export interface AppliedLabel {
  linkId: number;
  filterId: number;
  labelId: number;
  filterName: string;
  labelName: string;
}

export interface NewProductState {
  productId: number | null;
  name: string;
  category: Category | null;
  typeId: number | null;
  models: DraftModel[];
  cost: string;
  price: string;
  barcode: string;
  showOnStore: boolean;
  showOnPos: boolean;
  savedImages: SavedImage[];
  // Fase 5 / 03: fotos subiendose y nombre del modelo, para la pantalla "Subir fotos".
  uploads: UploadItem[];
  uploadsTitle: string;
  // "create": alta de producto (Fase 3). "edit": editar un producto ya creado (Fase 4).
  mode: "create" | "edit";
  // Paso 4.
  description: string;
  sku: string;
  // Fase 3 / 36: impuestos en porcentaje ("0" = no aplica).
  ivaRate: string;
  iepsRate: string;
  // Fase 3 / 37–38: etiquetas ya aplicadas al producto en el servidor, catálogo de filtros
  // del negocio y la seleccion que se ests editando.
  appliedLabels: AppliedLabel[];
  filterCatalog: { filters: CatalogFilter[]; labels: CatalogLabel[] };
  labelSelection: number[];
  // Fase 3 / 39: PDFs ya guardados.
  documents: SavedDocument[];
  // Presentacion del Simple ya creada: si se vuelve atrss se actualiza en vez de duplicarla.
  simplePresentationId: number | null;
  // Fase 3 / 40: datos para la pantalla de exito.
  published: { name: string; photo: string | null } | null;
  simpleOffer: Offer;
  // Copias de trabajo de las pantallas de modelo (20/24) y de variante (25).
  editingModel: DraftModel | null;
  editingVariant: DraftVariant | null;
  isSaving: boolean;
  error: string | null;
}

const initialState: NewProductState = {
  productId: null,
  name: "",
  category: null,
  typeId: null,
  models: [],
  cost: "",
  price: "",
  barcode: "",
  showOnStore: true,
  showOnPos: true,
  savedImages: [],
  uploads: [],
  uploadsTitle: "",
  mode: "create",
  description: "",
  sku: "",
  ivaRate: "0",
  iepsRate: "0",
  appliedLabels: [],
  filterCatalog: { filters: [], labels: [] },
  labelSelection: [],
  documents: [],
  simplePresentationId: null,
  published: null,
  simpleOffer: NO_OFFER,
  editingModel: null,
  editingVariant: null,
  isSaving: false,
  error: null,
};

let keyCounter = 0;
export const newKey = (prefix: string) =>
  `${prefix}-${Date.now()}-${keyCounter++}`;

export const hasPrice = (variant: Pick<DraftVariant, "cost" | "price">) =>
  variant.cost !== "" && variant.price !== "" && Number(variant.price) > 0;

export const emptyModel = (name: string): DraftModel => ({
  key: newKey("model"),
  modelId: null,
  name,
  isActive: false,
  photos: [],
  variants: [],
});

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "No pudimos guardar tu avance. Intenta nuevamente.";

type ThunkConfig = { state: RootState; rejectValue: string };

// Campos de una presentacion que comparten variantes y producto Simple.
function presentationData(
  variant: Pick<DraftVariant, "name" | "cost" | "price" | "barcode" | "offer">,
) {
  const discounted = hasOffer(variant.offer);
  return {
    name: variant.name.trim(),
    cost: variant.cost,
    price: variant.price,
    barcode: variant.barcode.trim() || undefined,
    is_discount: discounted,
    discount: discounted ? Math.round(Number(variant.offer.discount)) : 0,
    discount_store: discounted && variant.offer.onStore,
    discount_pos: discounted && variant.offer.onPos,
  };
}

// Si falla una foto, lo que ya se guardo (modelo, presentaciones, fotos anteriores) no se
// pierde: viaja en el error para que el borrador lo recuerde y no se dupliquen al reintentar.
class PartialSaveError extends Error {
  model: DraftModel;

  constructor(message: string, model: DraftModel) {
    super(message);
    this.model = model;
  }
}

type Report = (action: { type: string; payload?: unknown }) => void;

const idsOf = (photos: DraftPhoto[]) =>
  photos.flatMap((p) => (p.imageId ? [p.imageId] : []));

// Fotos que manda el servidor: si traen id se guarda para poder borrarlas u ordenarlas.
function serverPhotos(images: unknown, baseUrl: string): DraftPhoto[] {
  if (
    Array.isArray(images) &&
    images.every((i) => i && typeof i === "object" && "id" in i)
  ) {
    return images.flatMap((image) => {
      const [url] = extractImageUrls(image);
      return url
        ? [
            {
              key: newKey("photo"),
              uri: resolveImageUrl(url, baseUrl),
              source: "existing" as const,
              uploaded: true,
              imageId: Number((image as { id: number }).id),
            },
          ]
        : [];
    });
  }
  return extractImageUrls(images).map((url) => ({
    key: newKey("photo"),
    uri: resolveImageUrl(url, baseUrl),
    source: "existing" as const,
    uploaded: true,
    imageId: null,
  }));
}

// Fase 5 / 06 y 07
async function syncModelPhotos(
  context: BusinessRequestContext,
  modelId: number,
  photos: DraftPhoto[],
  savedImageIds: number[],
  beforeIds: number[] | null,
) {
  const result = photos.map((p) => ({ ...p }));
  try {
    const after = await getModelImageListRequest(context, modelId);
    if (beforeIds) {
      const fresh = after
        .filter((i) => !beforeIds.includes(i.id))
        .sort((a, b) => a.id - b.id);
      for (const photo of result.filter((p) => !p.imageId)) {
        const next = fresh.shift();
        if (!next) break;
        photo.imageId = next.id;
      }
    }
    const keptIds = result.flatMap((p) => (p.imageId ? [p.imageId] : []));
    for (const id of savedImageIds.filter((id) => !keptIds.includes(id))) {
      await deleteModelImageRequest(context, modelId, id);
    }
    const order = result.map((p) => p.imageId);
    const serverOrder = after
      .map((i) => i.id)
      .filter((id) => keptIds.includes(id));
    if (
      order.every((id): id is number => !!id) &&
      JSON.stringify(order) !== JSON.stringify(serverOrder)
    ) {
      await orderModelImagesRequest(context, modelId, order);
    }
  } catch (error) {
    throw new Error(
      `Las fotos se subieron, pero no pudimos actualizar el orden o borrar fotos: ${errorMessage(error)}`,
    );
  }
  return result;
}

const photoLabel = (index: number) =>
  index === 0 ? "Foto principal" : `Foto ${index + 1}`;

async function uploadPendingPhotos(
  context: BusinessRequestContext,
  modelId: number,
  photos: DraftPhoto[],
  onFailure: (photos: DraftPhoto[], error: unknown) => never,
  report?: Report,
  model?: { key: string; name: string; savedImageIds?: number[] },
) {
  const result = photos.map((photo) => ({ ...photo }));
  const pending = result.filter((photo) => !photo.uploaded);
  const savedImageIds = model?.savedImageIds ?? [];
  const changed =
    pending.length > 0 ||
    savedImageIds.some((id) => !result.some((p) => p.imageId === id)) ||
    JSON.stringify(result.map((p) => p.imageId ?? null)) !==
      JSON.stringify(savedImageIds);
  if (!changed) return result;
  let beforeIds: number[] | null = null;
  try {
    beforeIds = (await getModelImageListRequest(context, modelId)).map(
      (i) => i.id,
    );
  } catch {
    // Sin la lista previa no se asignan ids nuevos, pero la subida sigue.
  }
  if (pending.length === 0)
    return syncModelPhotos(context, modelId, result, savedImageIds, beforeIds);

  if (report && model) {
    report(
      startUploads({
        title: model.name,
        items: pending.map((photo) => ({
          key: photo.key,
          uri: photo.uri,
          source: photo.source,
          label: photoLabel(result.indexOf(photo)),
          modelKey: model.key,
          modelId,
          status: "pending" as const,
          progress: 0,
        })),
      }),
    );
  }

  let firstError: unknown = null;
  for (const photo of pending) {
    report?.(
      setUploadProgress({ key: photo.key, status: "uploading", progress: 0 }),
    );
    try {
      await uploadModelImageWithProgress(context, modelId, photo, (progress) =>
        report?.(
          setUploadProgress({ key: photo.key, status: "uploading", progress }),
        ),
      );
      photo.uploaded = true;
      report?.(
        setUploadProgress({ key: photo.key, status: "done", progress: 1 }),
      );
    } catch (error) {
      firstError ??= error;
      report?.(
        setUploadProgress({ key: photo.key, status: "error", progress: 0.4 }),
      );
    }
  }
  if (firstError)
    onFailure(
      result,
      new Error("Una foto no se pudo subir. Tus otras fotos están guardadas."),
    );
  return syncModelPhotos(context, modelId, result, savedImageIds, beforeIds);
}

export const saveBasicData = createAsyncThunk<number, void, ThunkConfig>(
  "newProduct/saveBasicData",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const { productId, name, category } = state.newProduct;
    const context = getBusinessContext(state);
    const data = { name: name.trim(), category: category?.id };
    try {
      if (productId) {
        await updateProductRequest(context, productId, data);
        return productId;
      }
      const product = await createProductRequest(context, {
        ...data,
        is_active: false,
      });
      return product.id;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const createCategory = createAsyncThunk<Category, string, ThunkConfig>(
  "newProduct/createCategory",
  async (name, { getState, rejectWithValue }) => {
    try {
      return await createCategoryRequest(
        getBusinessContext(getState()),
        name.trim(),
      );
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

const sameName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export const createAndApplyLabel = createAsyncThunk<
  AppliedLabel,
  { filterName: string; labelName: string },
  ThunkConfig
>(
  "newProduct/createAndApplyLabel",
  async ({ filterName, labelName }, { getState, rejectWithValue }) => {
    const state = getState();
    const { productId, appliedLabels } = state.newProduct;
    try {
      if (!productId) throw new Error("No encontramos tu borrador.");
      const context = getBusinessContext(state);
      const [filters, labels] = await Promise.all([
        getFiltersRequest(context),
        getLabelsRequest(context),
      ]);

      const filter =
        filters.results.find((f) => sameName(f.name, filterName)) ??
        (await createFilterRequest(context, filterName.trim()));
      const label =
        labels.results.find(
          (l) => l.filter === filter.id && sameName(l.name, labelName),
        ) ?? (await createLabelRequest(context, filter.id, labelName.trim()));

      if (appliedLabels.some((a) => a.labelId === label.id)) {
        throw new Error("Esta etiqueta ya está aplicada al producto.");
      }
      const link = await createProductFilterRequest(context, {
        product: productId,
        filter: filter.id,
        label: label.id,
      });
      return {
        linkId: link.id,
        filterId: filter.id,
        labelId: label.id,
        filterName: filter.name,
        labelName: label.name,
      };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const saveTaxesAndChannels = createAsyncThunk<
  {
    ivaRate: string;
    iepsRate: string;
    showOnStore: boolean;
    showOnPos: boolean;
  },
  {
    ivaRate: string;
    iepsRate: string;
    showOnStore: boolean;
    showOnPos: boolean;
  },
  ThunkConfig
>("newProduct/saveTaxes", async (values, { getState, rejectWithValue }) => {
  const state = getState();
  const { productId } = state.newProduct;
  try {
    if (!productId) throw new Error("No encontramos tu borrador.");
    await updateProductRequest(getBusinessContext(state), productId, {
      iva_rate: toApiRate(values.ivaRate),
      ieps_rate: toApiRate(values.iepsRate),
      display_on_store: values.showOnStore,
      display_on_pos: values.showOnPos,
    });
    return values;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchFilterCatalog = createAsyncThunk<
  { filters: CatalogFilter[]; labels: CatalogLabel[] },
  void,
  ThunkConfig
>("newProduct/fetchFilters", async (_, { getState, rejectWithValue }) => {
  try {
    const context = getBusinessContext(getState());
    const [filters, labels] = await Promise.all([
      getFiltersRequest(context),
      getLabelsRequest(context),
    ]);
    return {
      filters: filters.results.filter((f) => f.is_active !== false),
      labels: labels.results.filter((l) => l.is_active !== false),
    };
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const saveLabelSelection = createAsyncThunk<
  AppliedLabel[],
  void,
  ThunkConfig
>("newProduct/saveLabels", async (_, { getState, rejectWithValue }) => {
  const state = getState();
  const { productId, appliedLabels, labelSelection, filterCatalog } =
    state.newProduct;
  try {
    if (!productId) throw new Error("No encontramos tu borrador.");
    const context = getBusinessContext(state);
    const kept = appliedLabels.filter((a) =>
      labelSelection.includes(a.labelId),
    );
    for (const removed of appliedLabels.filter(
      (a) => !labelSelection.includes(a.labelId),
    )) {
      await deleteProductFilterRequest(context, removed.linkId);
    }
    const added: AppliedLabel[] = [];
    for (const labelId of labelSelection.filter(
      (id) => !appliedLabels.some((a) => a.labelId === id),
    )) {
      const label = filterCatalog.labels.find((l) => l.id === labelId);
      if (!label) continue;
      const link = await createProductFilterRequest(context, {
        product: productId,
        filter: label.filter,
        label: label.id,
      });
      added.push({
        linkId: link.id,
        filterId: label.filter,
        labelId: label.id,
        filterName:
          filterCatalog.filters.find((f) => f.id === label.filter)?.name ?? "",
        labelName: label.name,
      });
    }
    return [...kept, ...added];
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const saveDocuments = createAsyncThunk<
  SavedDocument[],
  DocumentItem[],
  ThunkConfig
>("newProduct/saveDocuments", async (items, { getState, rejectWithValue }) => {
  const state = getState();
  const { productId, documents } = state.newProduct;
  try {
    if (!productId) throw new Error("No encontramos tu borrador.");
    const context = getBusinessContext(state);
    for (const removed of documents.filter(
      (d) => !items.some((i) => i.id === d.id),
    )) {
      await deleteDocumentRequest(context, removed.id);
    }
    const saved: SavedDocument[] = documents.filter((d) =>
      items.some((i) => i.id === d.id),
    );
    for (const item of items.filter((i) => i.id === null && i.uri)) {
      const created = await uploadDocumentRequest(context, productId, {
        uri: item.uri!,
        name: item.name,
      });
      saved.push({
        id: created.id,
        name: created.name || item.name,
        sizeBytes: created.size_bytes ?? item.sizeBytes,
      });
    }
    return saved;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

interface ServerPresentation {
  id: number;
  name: string;
  price: string;
  cost: string;
  is_active: boolean;
  barcode: string | null;
  is_discount?: boolean;
  discount?: number;
  discount_store?: boolean;
  discount_pos?: boolean;
}

interface ServerModel {
  id: number;
  name: string;
  is_active: boolean;
  images?: unknown;
  presentations?: ServerPresentation[];
}

const toRate = (value: unknown) => String(Number(value ?? 0) || 0);

const offerOf = (p: ServerPresentation): Offer =>
  p.is_discount && Number(p.discount) > 0
    ? {
        discount: String(p.discount),
        onStore: !!p.discount_store,
        onPos: !!p.discount_pos,
      }
    : NO_OFFER;

export const loadProductForEdit = createAsyncThunk<
  Partial<NewProductState>,
  { productId: number; mode: "create" | "edit" },
  ThunkConfig
>(
  "newProduct/loadForEdit",
  async ({ productId, mode }, { getState, rejectWithValue }) => {
    const state = getState();
    try {
      const context = getBusinessContext(state);
      const [product, links, filters, labels, documents] = await Promise.all([
        getProductRequest(context, productId) as Promise<unknown> as Promise<
          Record<string, unknown> & { product_models?: ServerModel[] }
        >,
        getProductFiltersRequest(context, productId),
        getFiltersRequest(context),
        getLabelsRequest(context),
        getProductDocumentsRequest(context, productId),
      ]);

      const rawCategory = product.category as number | Category | null;
      const category =
        rawCategory && typeof rawCategory === "object"
          ? rawCategory
          : (state.products.categories.find((c) => c.id === rawCategory) ??
            null);

      const models: DraftModel[] = (product.product_models ?? []).map((m) => ({
        key: newKey("model"),
        modelId: m.id,
        name: m.name,
        isActive: m.is_active,
        photos: serverPhotos(m.images, context.baseUrl),
        savedImageIds: serverPhotos(m.images, context.baseUrl).flatMap((p) =>
          p.imageId ? [p.imageId] : [],
        ),
        variants: (m.presentations ?? []).map((p) => ({
          key: newKey("variant"),
          presentationId: p.id,
          name: p.name,
          cost: String(Number(p.cost) || ""),
          price: String(Number(p.price) || ""),
          isActive: p.is_active,
          barcode: p.barcode ?? "",
          offer: offerOf(p),
        })),
      }));

      const typeId = Number(product.type) || null;
      const first = typeId === SIMPLE_TYPE ? models[0]?.variants[0] : undefined;

      return {
        mode,
        productId,
        name: String(product.name ?? ""),
        category,
        typeId,
        models,
        cost: first?.cost ?? "",
        price: first?.price ?? "",
        barcode: first?.barcode ?? "",
        simpleOffer: first?.offer ?? NO_OFFER,
        simplePresentationId: first?.presentationId ?? null,
        showOnStore: product.display_on_store !== false,
        showOnPos: product.display_on_pos !== false,
        description: String(product.description ?? ""),
        sku: String(product.sku ?? ""),
        ivaRate: toRate(product.iva_rate),
        iepsRate: toRate(product.ieps_rate),
        appliedLabels: links.map((link) => ({
          linkId: link.id,
          filterId: link.filter,
          labelId: link.label,
          filterName:
            filters.results.find((f) => f.id === link.filter)?.name ?? "",
          labelName:
            labels.results.find((l) => l.id === link.label)?.name ?? "",
        })),
        filterCatalog: { filters: filters.results, labels: labels.results },
        documents: documents.map((d) => ({
          id: d.id,
          name: d.name,
          sizeBytes: d.size_bytes ?? 0,
        })),
      };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const saveGeneralInfo = createAsyncThunk<
  { name: string; sku: string; description: string; category: Category | null },
  { name: string; sku: string; description: string; category: Category | null },
  ThunkConfig
>("newProduct/saveGeneral", async (values, { getState, rejectWithValue }) => {
  const state = getState();
  const { productId } = state.newProduct;
  try {
    if (!productId) throw new Error("No encontramos el producto.");
    await updateProductRequest(getBusinessContext(state), productId, {
      name: values.name.trim(),
      sku: values.sku.trim(),
      description: values.description.trim(),
      category: values.category?.id,
    });
    return { ...values, name: values.name.trim(), sku: values.sku.trim() };
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const retryUpload = createAsyncThunk<void, string, ThunkConfig>(
  "newProduct/retryUpload",
  async (key, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const item = state.newProduct.uploads.find((u) => u.key === key);
    if (!item) return;
    dispatch(setUploadProgress({ key, status: "uploading", progress: 0 }));
    try {
      await uploadModelImageWithProgress(
        getBusinessContext(state),
        item.modelId,
        item,
        (progress) =>
          dispatch(setUploadProgress({ key, status: "uploading", progress })),
      );
      dispatch(setUploadProgress({ key, status: "done", progress: 1 }));
      dispatch(markPhotoUploaded({ modelKey: item.modelKey, photoKey: key }));
    } catch (error) {
      dispatch(setUploadProgress({ key, status: "error", progress: 0.4 }));
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const confirmProductType = createAsyncThunk<
  { typeId: number; model: DraftModel },
  { typeId: number; modelName: string },
  ThunkConfig
>(
  "newProduct/confirmType",
  async ({ typeId, modelName }, { getState, rejectWithValue }) => {
    const state = getState();
    const { productId, name } = state.newProduct;
    try {
      if (!productId) throw new Error("No encontramos tu borrador.");
      const context = getBusinessContext(state);
      await updateProductRequest(context, productId, { type: typeId });
      const title = typeId === SIMPLE_TYPE ? name.trim() : modelName.trim();
      const created = await createModelRequest(context, productId, title);
      const model = { ...emptyModel(title), modelId: created.id };
      // "Con modelos": cada modelo tiene un solo precio, guardado como su única presentación.
      if (typeId === MODELS_TYPE) {
        model.variants = [emptyVariant(title)];
      }
      return { typeId, model };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

async function persistModel(
  state: RootState,
  model: DraftModel,
  report?: Report,
): Promise<DraftModel> {
  const { productId } = state.newProduct;
  if (!productId) throw new Error("No encontramos tu borrador.");
  const context = getBusinessContext(state);
  const name = model.name.trim();

  let modelId = model.modelId;
  if (modelId) {
    await updateModelRequest(context, modelId, { name });
  } else {
    modelId = (await createModelRequest(context, productId, name)).id;
  }

  const variants: DraftVariant[] = [];
  for (const variant of model.variants) {
    if (!hasPrice(variant)) {
      variants.push(variant);
      continue;
    }
    const data = { ...presentationData(variant), is_active: variant.isActive };
    if (variant.presentationId) {
      await updatePresentationRequest(context, variant.presentationId, data);
      variants.push(variant);
    } else {
      const created = await createPresentationRequest(context, {
        ...data,
        product: productId,
        model: modelId,
      });
      variants.push({ ...variant, presentationId: created.id });
    }
  }

  if (model.modelId || model.isActive) {
    await updateModelRequest(context, modelId, { is_active: model.isActive });
  }

  const saved = { ...model, name, modelId, variants };
  const photos = await uploadPendingPhotos(
    context,
    modelId,
    model.photos,
    (partial, error) => {
      throw new PartialSaveError(errorMessage(error), {
        ...saved,
        photos: partial,
      });
    },
    report,
    { key: model.key, name, savedImageIds: model.savedImageIds },
  );
  return { ...saved, photos, savedImageIds: idsOf(photos) };
}

export const saveModel = createAsyncThunk<DraftModel, DraftModel, ThunkConfig>(
  "newProduct/saveModel",
  async (model, { getState, dispatch, rejectWithValue }) => {
    try {
      return await persistModel(getState(), model, dispatch);
    } catch (error) {
      if (error instanceof PartialSaveError)
        dispatch(rememberSavedModel(error.model));
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const saveAllModels = createAsyncThunk<DraftModel[], void, ThunkConfig>(
  "newProduct/saveAllModels",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const saved: DraftModel[] = [];
      for (const model of getState().newProduct.models) {
        saved.push(await persistModel(getState(), model, dispatch));
      }
      return saved;
    } catch (error) {
      if (error instanceof PartialSaveError)
        dispatch(rememberSavedModel(error.model));
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const checkBarcodeInUse = createAsyncThunk<
  boolean,
  { barcode: string; variantKey: string | null },
  ThunkConfig
>(
  "newProduct/checkBarcode",
  async ({ barcode, variantKey }, { getState, rejectWithValue }) => {
    const code = barcode.trim();
    if (!code) return false;
    const state = getState();
    const usedInDraft = [
      ...state.newProduct.models,
      state.newProduct.editingModel,
    ]
      .flatMap((m) => m?.variants ?? [])
      .some((v) => v.key !== variantKey && v.barcode.trim() === code);
    if (usedInDraft) return true;

    const own = state.newProduct.editingModel?.variants.find(
      (v) => v.key === variantKey,
    );

    const ownId = variantKey
      ? own?.presentationId
      : state.newProduct.simplePresentationId;
    try {
      const found = await findPresentationByBarcode(
        getBusinessContext(state),
        code,
      );
      return found !== null && found.id !== ownId;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const fetchSavedImages = createAsyncThunk<
  SavedImage[],
  void,
  ThunkConfig
>("newProduct/fetchSavedImages", async (_, { getState, rejectWithValue }) => {
  try {
    const context = getBusinessContext(getState());
    const [images, models] = await Promise.all([
      getModelImagesRequest(context),
      getModelsRequest(context),
    ]);
    const modelById = new Map(models.results.map((m) => [m.id, m]));

    const seen = new Set<string>();
    return images.results.flatMap((image) => {
      const [raw] = extractImageUrls(image);
      const url = raw ? resolveImageUrl(raw, context.baseUrl) : null;
      if (!url || seen.has(url)) return [];
      seen.add(url);
      return url
        ? [
            {
              url,
              modelName: modelById.get(image.model)?.name ?? "",
              productName: (() => {
                const product = modelById.get(image.model)?.product;
                return typeof product === "object" ? (product.name ?? "") : "";
              })(),
            },
          ]
        : [];
    });
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const saveSimpleProduct = createAsyncThunk<
  { presentationId: number; photos: DraftPhoto[] },
  void,
  ThunkConfig
>(
  "newProduct/saveSimple",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const {
      productId,
      models,
      name,
      cost,
      price,
      barcode,
      showOnStore,
      showOnPos,
      simpleOffer,
      simplePresentationId,
    } = state.newProduct;
    const model = models[0];
    try {
      if (!productId || !model?.modelId)
        throw new Error("No encontramos tu borrador.");
      const context = getBusinessContext(state);
      await updateProductRequest(context, productId, {
        display_on_store: showOnStore,
        display_on_pos: showOnPos,
      });
      const data = presentationData({
        name,
        cost,
        price,
        barcode,
        offer: simpleOffer,
      });
      let presentationId = simplePresentationId;
      if (presentationId) {
        await updatePresentationRequest(context, presentationId, data);
      } else {
        presentationId = (
          await createPresentationRequest(context, {
            ...data,
            product: productId,
            model: model.modelId,
          })
        ).id;

        dispatch(updateDraft({ simplePresentationId: presentationId }));
      }
      const photos = await uploadPendingPhotos(
        context,
        model.modelId,
        model.photos,
        (partial, error) => {
          dispatch(setFirstModelPhotos(partial));
          throw error;
        },
        dispatch,
        {
          key: model.key,
          name: name.trim(),
          savedImageIds: model.savedImageIds,
        },
      );
      return { presentationId, photos };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export function getPublishChecklist(state: NewProductState) {
  const isSimple = state.typeId === SIMPLE_TYPE;
  return [
    {
      key: "basics",
      label: "Nombre y categoría",
      done: !!state.name.trim() && !!state.category,
    },
    { key: "type", label: "Tipo de producto", done: state.typeId !== null },
    {
      key: "photo",
      label: "Al menos 1 foto",
      done: state.models.some((m) => m.photos.length > 0),
    },
    {
      key: "price",
      label: "Al menos 1 precio",
      done: isSimple
        ? hasPrice({ cost: state.cost, price: state.price })
        : state.models.some((m) => m.variants.some(hasPrice)),
    },
    {
      key: "description",
      label: "Descripción",
      done: !!state.description.trim(),
    },
  ];
}

export const publishProduct = createAsyncThunk<
  { published: boolean; activatedKeys: string[] },
  { publish: boolean },
  ThunkConfig
>("newProduct/publish", async ({ publish }, { getState, rejectWithValue }) => {
  const state = getState();
  const { productId, description, sku, typeId, models } = state.newProduct;
  try {
    if (!productId) throw new Error("No encontramos tu borrador.");
    const context = getBusinessContext(state);

    const simpleModel = models[0];
    if (publish && typeId === SIMPLE_TYPE && simpleModel?.modelId) {
      await updateModelRequest(context, simpleModel.modelId, {
        is_active: true,
      });
    }

    const activatedKeys: string[] = [];
    if (publish && typeId !== SIMPLE_TYPE && !models.some((m) => m.isActive)) {
      for (const model of models) {
        if (!model.modelId || !model.variants.some(hasPrice)) continue;
        await updateModelRequest(context, model.modelId, { is_active: true });
        activatedKeys.push(model.key);
      }
    }
    await updateProductRequest(context, productId, {
      description: description.trim(),
      sku: sku.trim() || undefined,
      is_active: publish,
    });
    return { published: publish, activatedKeys };
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

const newProductSlice = createSlice({
  name: "newProduct",
  initialState,
  reducers: {
    updateDraft(state, action: PayloadAction<Partial<NewProductState>>) {
      Object.assign(state, action.payload);
    },

    startUploads(
      state,
      action: PayloadAction<{ title: string; items: UploadItem[] }>,
    ) {
      state.uploadsTitle = action.payload.title;
      state.uploads = action.payload.items;
    },
    setUploadProgress(
      state,
      action: PayloadAction<{
        key: string;
        status: UploadItem["status"];
        progress: number;
      }>,
    ) {
      const item = state.uploads.find((u) => u.key === action.payload.key);
      if (item) {
        item.status = action.payload.status;
        item.progress = action.payload.progress;
      }
    },
    clearUploads(state) {
      state.uploads = [];
    },
    markPhotoUploaded(
      state,
      action: PayloadAction<{ modelKey: string; photoKey: string }>,
    ) {
      for (const model of [...state.models, state.editingModel]) {
        if (model?.key !== action.payload.modelKey) continue;
        const photo = model.photos.find(
          (p) => p.key === action.payload.photoKey,
        );
        if (photo) photo.uploaded = true;
      }
    },

    startEditingLabels(state) {
      state.labelSelection = state.appliedLabels.map((a) => a.labelId);
    },
    toggleLabel(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.labelSelection = state.labelSelection.includes(id)
        ? state.labelSelection.filter((x) => x !== id)
        : [...state.labelSelection, id];
    },

    rememberSavedModel(state, action: PayloadAction<DraftModel>) {
      const index = state.models.findIndex((m) => m.key === action.payload.key);
      if (index >= 0) state.models[index] = action.payload;
      else state.models.push(action.payload);
      if (state.editingModel?.key === action.payload.key)
        state.editingModel = action.payload;
    },
    // Fotos del producto Simple (su único modelo).
    setFirstModelPhotos(state, action: PayloadAction<DraftPhoto[]>) {
      if (state.models[0]) state.models[0].photos = action.payload;
    },
    resetDraft() {
      return initialState;
    },
    // Retomar un borrador guardado en el teléfono.
    restoreDraft(_state, action: PayloadAction<SavedDraft>) {
      return { ...initialState, ...action.payload };
    },

    // Abre un modelo para editarlo (o null para cerrarlo).
    startEditingModel(state, action: PayloadAction<string | null>) {
      state.editingModel =
        state.models.find((m) => m.key === action.payload) ?? null;
      state.error = null;
    },
    updateEditingModel(state, action: PayloadAction<Partial<DraftModel>>) {
      if (state.editingModel) Object.assign(state.editingModel, action.payload);
    },
    // Abre una variante del modelo en edición; null crea una nueva.
    startEditingVariant(state, action: PayloadAction<string | null>) {
      const existing = state.editingModel?.variants.find(
        (v) => v.key === action.payload,
      );
      state.editingVariant = existing ? { ...existing } : emptyVariant();
      state.error = null;
    },
    updateEditingVariant(state, action: PayloadAction<Partial<DraftVariant>>) {
      if (state.editingVariant)
        Object.assign(state.editingVariant, action.payload);
    },
    commitEditingVariant(state) {
      const { editingModel, editingVariant } = state;
      if (!editingModel || !editingVariant) return;
      const variant = { ...editingVariant, name: editingVariant.name.trim() };
      const index = editingModel.variants.findIndex(
        (v) => v.key === variant.key,
      );
      if (index >= 0) editingModel.variants[index] = variant;
      else editingModel.variants.push(variant);
      state.editingVariant = null;
    },

    addEditingVariants(
      state,
      action: PayloadAction<{ names: string[]; cost: string; price: string }>,
    ) {
      if (!state.editingModel) return;
      const { names, cost, price } = action.payload;
      const existing = new Set(
        state.editingModel.variants.map((v) => v.name.toLowerCase()),
      );
      for (const name of names) {
        if (!existing.has(name.toLowerCase())) {
          state.editingModel.variants.push(emptyVariant(name, cost, price));
        }
      }
    },
    // El escáner deja el código donde se pidió.
    applyScannedBarcode(
      state,
      action: PayloadAction<{ target: BarcodeTarget; code: string }>,
    ) {
      const { target, code } = action.payload;
      if (target === "variant" && state.editingVariant)
        state.editingVariant.barcode = code;
      if (target === "simple") state.barcode = code;
    },

    setVariantPrice(
      state,
      action: PayloadAction<{
        modelKey: string;
        variantKey: string;
        price: string;
      }>,
    ) {
      const model = state.models.find((m) => m.key === action.payload.modelKey);
      const variant = model?.variants.find(
        (v) => v.key === action.payload.variantKey,
      );
      if (variant) variant.price = action.payload.price;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveBasicData.fulfilled, (state, action) => {
        state.productId = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.category = action.payload;
      })
      .addCase(confirmProductType.fulfilled, (state, action) => {
        state.typeId = action.payload.typeId;
        state.models = [action.payload.model];
      })
      .addCase(saveModel.fulfilled, (state, action) => {
        const index = state.models.findIndex(
          (m) => m.key === action.payload.key,
        );
        if (index >= 0) state.models[index] = action.payload;
        else state.models.push(action.payload);
        if (state.editingModel?.key === action.payload.key)
          state.editingModel = action.payload;
      })
      .addCase(saveAllModels.fulfilled, (state, action) => {
        state.models = action.payload;
      })
      .addCase(fetchSavedImages.fulfilled, (state, action) => {
        state.savedImages = action.payload;
      })
      .addCase(saveSimpleProduct.fulfilled, (state, action) => {
        state.simplePresentationId = action.payload.presentationId;
        if (state.models[0]) {
          state.models[0].photos = action.payload.photos;
          state.models[0].savedImageIds = idsOf(action.payload.photos);
        }
      })
      .addCase(publishProduct.fulfilled, (state, action) => {
        for (const model of state.models) {
          if (action.payload.activatedKeys.includes(model.key))
            model.isActive = true;
        }
        if (action.payload.published) {
          state.published = {
            name: state.name.trim(),
            photo: state.models[0]?.photos[0]?.uri ?? null,
          };
        }
      })
      .addCase(createAndApplyLabel.fulfilled, (state, action) => {
        const applied = action.payload;
        state.appliedLabels.push(applied);
        const { filters, labels } = state.filterCatalog;
        if (!filters.some((f) => f.id === applied.filterId)) {
          filters.push({ id: applied.filterId, name: applied.filterName });
        }
        if (!labels.some((l) => l.id === applied.labelId)) {
          labels.push({
            id: applied.labelId,
            name: applied.labelName,
            filter: applied.filterId,
          });
        }
        if (!state.labelSelection.includes(applied.labelId))
          state.labelSelection.push(applied.labelId);
      })
      .addCase(loadProductForEdit.fulfilled, (_state, action) => ({
        ...initialState,
        ...action.payload,
      }))
      .addCase(saveGeneralInfo.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      })
      .addCase(saveTaxesAndChannels.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      })
      .addCase(fetchFilterCatalog.fulfilled, (state, action) => {
        state.filterCatalog = action.payload;
      })
      .addCase(saveLabelSelection.fulfilled, (state, action) => {
        state.appliedLabels = action.payload;
        state.labelSelection = action.payload.map((a) => a.labelId);
      })
      .addCase(saveDocuments.fulfilled, (state, action) => {
        state.documents = action.payload;
      })
      .addCase(logout.pending, () => initialState)
      .addMatcher(
        (action) =>
          action.type.startsWith("newProduct/") &&
          !action.type.startsWith("newProduct/checkBarcode") &&
          !action.type.startsWith("newProduct/retryUpload") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.isSaving = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("newProduct/") &&
          action.type.endsWith("/fulfilled"),
        (state) => {
          state.isSaving = false;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("newProduct/") &&
          action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isSaving = false;
          state.error =
            action.payload ??
            "No pudimos guardar tu avance. Intenta nuevamente.";
        },
      );
  },
});

export const {
  updateDraft,
  setFirstModelPhotos,
  rememberSavedModel,
  startEditingLabels,
  toggleLabel,
  startUploads,
  setUploadProgress,
  clearUploads,
  markPhotoUploaded,
  resetDraft,
  restoreDraft,
  startEditingModel,
  updateEditingModel,
  startEditingVariant,
  updateEditingVariant,
  commitEditingVariant,
  addEditingVariants,
  applyScannedBarcode,
  setVariantPrice,
} = newProductSlice.actions;
export default newProductSlice.reducer;

// Precio mínimo y máximo de un modelo
export function priceRange(model: DraftModel) {
  const prices = model.variants.filter(hasPrice).map((v) => Number(v.price));
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function referencePrice(state: NewProductState): {
  price: number;
  offer: Offer;
} {
  if (state.typeId === SIMPLE_TYPE)
    return { price: Number(state.price) || 0, offer: state.simpleOffer };
  for (const model of state.models) {
    const variant = model.variants.find(hasPrice);
    if (variant)
      return { price: Number(variant.price) || 0, offer: variant.offer };
  }
  return { price: 0, offer: NO_OFFER };
}

// Lo que se guarda en el teléfono
export type SavedDraft = Omit<
  NewProductState,
  | "isSaving"
  | "error"
  | "editingModel"
  | "editingVariant"
  | "savedImages"
  | "filterCatalog"
  | "labelSelection"
  | "published"
  | "uploads"
  | "uploadsTitle"
>;

export function toSavedDraft(state: NewProductState): SavedDraft {
  const {
    isSaving: _isSaving,
    error: _error,
    editingModel: _editingModel,
    editingVariant: _editingVariant,
    savedImages: _savedImages,
    filterCatalog: _filterCatalog,
    labelSelection: _labelSelection,
    published: _published,
    uploads: _uploads,
    uploadsTitle: _uploadsTitle,
    ...saved
  } = state;
  return saved;
}

export function resumeRoute(draft: SavedDraft) {
  if (!draft.typeId) return "/new-product/type" as const;
  if (draft.typeId === SIMPLE_TYPE) {
    return draft.simplePresentationId
      ? ("/new-product/publish" as const)
      : ("/new-product/prices" as const);
  }
  return "/new-product/models" as const;
}
