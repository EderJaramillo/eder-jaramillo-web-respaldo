import { logout } from "@/features/auth/authSlice";
import { getBusinessContext } from "@/features/business/businessContext";
import {
  extractImageUrls,
  resolveImageUrl,
} from "@/features/products/productImages";
import {
  getModelImagesRequest,
  getModelsRequest,
} from "@/features/products/productsApi";
import type { RootState } from "@/store/store";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

export interface GalleryPhoto {
  id: number;
  url: string;
  productName: string;
  modelName: string;
}

interface GalleryState {
  photos: GalleryPhoto[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  filter: string | null;
  page: number;
}

const initialState: GalleryState = {
  photos: [],
  status: "idle",
  error: null,
  filter: null,
  page: 0,
};

export const GALLERY_PAGE_SIZE = 6;

export const fetchGallery = createAsyncThunk<
  GalleryPhoto[],
  void,
  { state: RootState; rejectValue: string }
>("gallery/fetch", async (_, { getState, rejectWithValue }) => {
  try {
    const context = getBusinessContext(getState());
    const [images, models] = await Promise.all([
      getModelImagesRequest(context),
      getModelsRequest(context),
    ]);
    const modelById = new Map(models.results.map((m) => [m.id, m]));
    // Una misma foto puede estar en varios modelos: se muestra una vez.
    const seen = new Set<string>();
    return images.results.flatMap((image) => {
      const [raw] = extractImageUrls(image);
      const url = raw ? resolveImageUrl(raw, context.baseUrl) : null;
      if (!url || seen.has(url)) return [];
      seen.add(url);
      const model = modelById.get(image.model);
      const product = model?.product;
      return [
        {
          id: image.id,
          url,
          productName: typeof product === "object" ? (product.name ?? "") : "",
          modelName: model?.name ?? "",
        },
      ];
    });
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "No se pudo cargar la galería.",
    );
  }
});

const gallerySlice = createSlice({
  name: "gallery",
  initialState,
  reducers: {
    setGalleryFilter(state, action: PayloadAction<string | null>) {
      state.filter = action.payload;
      state.page = 0;
    },
    setGalleryPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGallery.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchGallery.fulfilled, (state, action) => {
        state.status = "ready";
        state.photos = action.payload;
        state.page = 0;
      })
      .addCase(fetchGallery.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "No se pudo cargar la galería.";
      })
      .addCase(logout.pending, () => initialState);
  },
});

export const { setGalleryFilter, setGalleryPage } = gallerySlice.actions;
export default gallerySlice.reducer;
