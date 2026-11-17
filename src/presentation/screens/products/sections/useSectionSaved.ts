import { fetchProductDetail } from "@/features/products/productDetailSlice";
import { fetchProducts } from "@/features/products/productsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { router } from "expo-router";
import { useState } from "react";

export function useSnapshot<T>(current: T) {
  const [initial] = useState(current);
  return {
    initial,
    isDirty: JSON.stringify(initial) !== JSON.stringify(current),
  };
}

export function useAfterSave() {
  const dispatch = useAppDispatch();
  const productId = useAppSelector((s) => s.newProduct.productId);
  return () => {
    if (productId) dispatch(fetchProductDetail(productId));
    dispatch(fetchProducts("refresh"));
    router.back();
  };
}
