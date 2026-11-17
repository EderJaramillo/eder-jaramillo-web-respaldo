import { setUnauthorizedHandler } from "@/config/api/api";
import authReducer from "@/features/auth/authSlice";
import businessReducer from "@/features/business/businessSlice";
import galleryReducer from "@/features/gallery/gallerySlice";
import noticesReducer, {
  sessionExpired,
} from "@/features/notices/noticesSlice";
import { toastListener } from "@/features/notices/toastListener";
import {
  deleteDraftFile,
  saveDraftFile,
} from "@/features/products/draftStorage";
import newProductReducer, {
  publishProduct,
  resetDraft,
  toSavedDraft,
} from "@/features/products/newProductSlice";
import productDetailReducer from "@/features/products/productDetailSlice";
import productsReducer from "@/features/products/productsSlice";
import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";

const rootReducer = {
  auth: authReducer,
  business: businessReducer,
  products: productsReducer,
  newProduct: newProductReducer,
  productDetail: productDetailReducer,
  gallery: galleryReducer,
  notices: noticesReducer,
};

// Cada cambio del borrador se guarda en el teléfono; al publicar o salir se borra.
const draftListener = createListenerMiddleware();
draftListener.startListening({
  predicate: (action) => action.type.startsWith("newProduct/"),
  effect: async (action, api) => {
    const state = api.getState() as {
      business: { activeSlug: string | null };
      newProduct: Parameters<typeof toSavedDraft>[0];
    };
    const slug = state.business.activeSlug;
    if (!slug) return;
    // Editar un producto ya creado
    const before = (api.getOriginalState() as typeof state).newProduct;
    if (resetDraft.match(action) || publishProduct.fulfilled.match(action)) {
      if (before.mode !== "edit") deleteDraftFile(slug);
      return;
    }
    if (state.newProduct.mode === "edit") return;
    // Agrupa ráfagas de cambios
    api.cancelActiveListeners();
    await api.delay(400);
    const draft = (api.getState() as typeof state).newProduct;
    if (draft.productId && !draft.published && draft.mode !== "edit") {
      saveDraftFile(slug, toSavedDraft(draft));
    }
  },
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault().prepend(draftListener.middleware, toastListener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Fase 6 / 05: cualquier petición que responda 401 muestra "Tu sesión expiró".
setUnauthorizedHandler(() => {
  if (store.getState().auth.session) store.dispatch(sessionExpired());
});
