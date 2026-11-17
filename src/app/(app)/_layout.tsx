import UploadProgressModal from "@/presentation/theme/components/new-product/UploadProgressModal";
import NoticesHost from "@/presentation/theme/components/NoticesHost";
import { Stack } from "expo-router";

// Pantallas dentro del negocio activo (peticiones a la base de datos de la tienda).
export default function AppLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <UploadProgressModal />
      <NoticesHost />
    </>
  );
}
