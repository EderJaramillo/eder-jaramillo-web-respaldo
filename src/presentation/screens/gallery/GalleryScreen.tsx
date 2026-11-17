import { Colors, iconStroke, radius, spacing } from "@/config/theme/theme";
import {
  GALLERY_PAGE_SIZE,
  fetchGallery,
  setGalleryFilter,
  setGalleryPage,
  type GalleryPhoto,
} from "@/features/gallery/gallerySlice";
import AppBar from "@/presentation/theme/components/AppBar";
import EmptyState from "@/presentation/theme/components/EmptyState";
import InfoBanner from "@/presentation/theme/components/InfoBanner";
import FilterChip from "@/presentation/theme/components/products/FilterChip";
import TabScreen, { goToTab } from "@/presentation/theme/components/TabScreen";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedText from "@/presentation/theme/components/ThemedText";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActiveBusiness } from "@/store/selectors";
import { Image } from "expo-image";
import { Check, CloudOff, ImagePlus, Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const photoTitle = (photo: GalleryPhoto) =>
  [photo.productName, photo.modelName].filter(Boolean).join(" · ") || "Foto";

// Fase 5 / 08 (galería), 12 (vacía), 13 (cargando) y 14 (error).
const GalleryScreen = () => {
  const dispatch = useAppDispatch();
  const business = useAppSelector(selectActiveBusiness);
  const { photos, status, error, filter, page } = useAppSelector((s) => s.gallery);
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    dispatch(fetchGallery());
  }, [dispatch]);

  // Filtros por producto (Playera, Termo, Café…).
  const products = useMemo(
    () => [...new Set(photos.map((p) => p.productName).filter(Boolean))],
    [photos],
  );
  const visible = filter ? photos.filter((p) => p.productName === filter) : photos;
  const pages = Math.max(1, Math.ceil(visible.length / GALLERY_PAGE_SIZE));
  const pagePhotos = visible.slice(page * GALLERY_PAGE_SIZE, (page + 1) * GALLERY_PAGE_SIZE);

  const header = <AppBar title="Galería del negocio" actionIcon={Search} actionLabel="Buscar" />;

  const chips = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      <FilterChip label="Todos" selected={filter === null} onPress={() => dispatch(setGalleryFilter(null))} />
      {products.map((name) => (
        <FilterChip
          key={name}
          label={name}
          selected={filter === name}
          onPress={() => dispatch(setGalleryFilter(name))}
        />
      ))}
    </ScrollView>
  );

  if (status === "error") {
    return (
      <TabScreen
        active="gallery"
        header={header}
        footer={<ThemedButton title="Reintentar" onPress={() => dispatch(fetchGallery())} />}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <EmptyState
            icon={CloudOff}
            title="No pudimos cargar tus fotos"
            description="Tus fotos siguen guardadas. Revisa tu conexión e intenta nuevamente."
          />
          <InfoBanner tone="error" message={error ?? "No se pudo cargar la galería."} />
        </ScrollView>
      </TabScreen>
    );
  }

  if (status === "idle" || (status === "loading" && photos.length === 0)) {
    return (
      <TabScreen active="gallery" header={header}>
        <View style={styles.content} accessibilityLabel="Cargando fotos">
          <ThemedText variant="caption" color={Colors.textSecondary} numberOfLines={1}>
            Cargando las fotos de {business?.tenant_name ?? "tu negocio"}…
          </ThemedText>
          <View style={styles.skeletonHero} />
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={styles.skeletonThumb} />
              <View style={styles.skeletonLines}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, styles.skeletonShort]} />
              </View>
            </View>
          ))}
        </View>
      </TabScreen>
    );
  }

  if (photos.length === 0) {
    return (
      <TabScreen active="gallery" header={header}>
        <ScrollView contentContainerStyle={styles.content}>
          {chips}
          <EmptyState
            icon={ImagePlus}
            title="Aún no tienes fotos"
            description="Las fotos que agregues a tus productos aparecerán aquí. Podrás reutilizarlas en otros modelos."
          />
          <ThemedButton title="Agregar fotos" onPress={() => goToTab("products")} />
        </ScrollView>
      </TabScreen>
    );
  }

  return (
    // Desde la pestaña no hay un modelo al cual asignarla: para reutilizar una foto se usa
    // "Usar foto ya subida" dentro del modelo. Aquí solo se consulta.
    <TabScreen active="gallery" header={header}>
      <ScrollView contentContainerStyle={styles.content}>
        {chips}
        <ThemedText variant="caption" color={Colors.textSecondary}>
          Fotos que ya subiste · Página {page + 1} de {pages}
        </ThemedText>
        <View style={styles.grid}>
          {pagePhotos.map((photo) => {
            const isSelected = selected?.id === photo.id;
            return (
              <Pressable
                key={photo.id}
                style={styles.cell}
                onPress={() => setSelected(isSelected ? null : photo)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={photoTitle(photo)}
              >
                <Image
                  source={photo.url}
                  style={[styles.photo, isSelected && styles.photoSelected]}
                  contentFit="cover"
                />
                <ThemedText variant="caption" numberOfLines={1}>
                  {photoTitle(photo)}
                </ThemedText>
                {isSelected && (
                  <View style={styles.selectedRow}>
                    <Check size={14} color={Colors.primary} strokeWidth={iconStroke} absoluteStrokeWidth />
                    <ThemedText variant="caption" color={Colors.primary}>
                      Elegida
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        {selected && (
          <InfoBanner
            message={`Seleccionada: ${photoTitle(selected)}. Para usarla en otro modelo, elige "Usar foto ya subida" al agregar fotos.`}
          />
        )}
        {pages > 1 && (
          <View style={styles.pager}>
            <ThemedButton
              title="Anterior"
              variant="text"
              disabled={page === 0}
              onPress={() => dispatch(setGalleryPage(page - 1))}
            />
            <ThemedText variant="caption" color={Colors.textSecondary}>
              {page + 1} / {pages}
            </ThemedText>
            <ThemedButton
              title="Siguiente"
              variant="text"
              disabled={page >= pages - 1}
              onPress={() => dispatch(setGalleryPage(page + 1))}
            />
          </View>
        )}
      </ScrollView>
    </TabScreen>
  );
};

export default GalleryScreen;

const skeleton = Colors.border;

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  chips: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cell: {
    width: "31.5%",
    gap: spacing.xs,
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  photoSelected: {
    borderColor: Colors.primary,
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  skeletonHero: {
    height: 136,
    borderRadius: radius.md,
    backgroundColor: skeleton,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: Colors.surface,
  },
  skeletonThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: skeleton,
  },
  skeletonLines: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: skeleton,
  },
  skeletonShort: {
    width: "60%",
  },
});
