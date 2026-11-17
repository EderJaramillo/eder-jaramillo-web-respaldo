import {
  createAndApplyLabel,
  createCategory,
  saveDocuments,
  saveGeneralInfo,
  saveLabelSelection,
  saveModel,
  saveSimpleProduct,
  saveTaxesAndChannels,
  setUploadProgress,
} from "@/features/products/newProductSlice";
import { setDetailVisibility } from "@/features/products/productDetailSlice";
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { showToast } from "./noticesSlice";

export const toastListener = createListenerMiddleware();

toastListener.startListening({
  matcher: isAnyOf(
    saveSimpleProduct.fulfilled,
    saveGeneralInfo.fulfilled,
    saveTaxesAndChannels.fulfilled,
  ),
  effect: (_action, api) => {
    api.dispatch(showToast("Cambios guardados"));
  },
});

toastListener.startListening({
  actionCreator: saveModel.fulfilled,
  effect: (action, api) => {
    // Si el modelo no tenía id antes de guardar, se acaba de crear.
    api.dispatch(
      showToast(action.meta.arg.modelId ? "Modelo guardado" : "Modelo creado"),
    );
  },
});

toastListener.startListening({
  actionCreator: setUploadProgress,
  effect: (action, api) => {
    if (action.payload.status === "done")
      api.dispatch(showToast("Foto subida"));
  },
});

toastListener.startListening({
  matcher: isAnyOf(saveLabelSelection.fulfilled, createAndApplyLabel.fulfilled),
  effect: (_action, api) => {
    api.dispatch(showToast("Filtros guardados"));
  },
});

toastListener.startListening({
  actionCreator: saveDocuments.fulfilled,
  effect: (_action, api) => {
    api.dispatch(showToast("Documentos guardados"));
  },
});

toastListener.startListening({
  actionCreator: createCategory.fulfilled,
  effect: (_action, api) => {
    api.dispatch(showToast("Categoría creada"));
  },
});

toastListener.startListening({
  actionCreator: setDetailVisibility.fulfilled,
  effect: (action, api) => {
    api.dispatch(
      showToast(action.payload ? "Producto visible" : "Producto oculto"),
    );
  },
});
