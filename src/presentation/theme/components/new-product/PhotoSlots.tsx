import { Colors, iconStroke, radius, spacing } from "@/config/theme/theme";
import {
  MAX_PHOTOS,
  type DraftPhoto,
} from "@/features/products/newProductSlice";
import { Image } from "expo-image";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import InfoBanner from "../InfoBanner";
import ThemedText from "../ThemedText";
import PhotoManagerModal from "./PhotoManagerModal";
import PhotoSourceSheet from "./PhotoSourceSheet";

interface Props {
  photos: DraftPhoto[];
  onChange: (photos: DraftPhoto[]) => void;
  modelName: string;
}

const PhotoSlots = ({ photos, onChange, modelName }: Props) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [isManagerOpen, setIsManagerOpen] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="subtitle" style={styles.title}>
          Fotos del modelo
        </ThemedText>
        <ThemedText variant="caption" color={Colors.textSecondary}>
          {photos.length}/{MAX_PHOTOS}
        </ThemedText>
      </View>

      <View style={styles.slots}>
        {Array.from({ length: MAX_PHOTOS }, (_, index) => {
          const photo = photos[index];
          return photo ? (
            <Pressable
              key={photo.key}
              onPress={() => setIsManagerOpen(true)}
              style={styles.slot}
              accessibilityRole="button"
              accessibilityLabel={
                index === 0 ? "Foto principal" : `Foto ${index + 1}`
              }
              accessibilityHint="Abre las fotos del modelo para ordenarlas o eliminarlas"
            >
              <Image
                source={photo.uri}
                style={styles.photo}
                contentFit="cover"
              />
            </Pressable>
          ) : (
            <Pressable
              key={`empty-${index}`}
              onPress={() => setIsSheetOpen(true)}
              style={styles.slot}
              accessibilityRole="button"
              accessibilityLabel="Agregar foto"
            >
              <Camera
                size={24}
                color={Colors.primary}
                strokeWidth={iconStroke}
                absoluteStrokeWidth
              />
            </Pressable>
          );
        })}
      </View>

      {photos.length >= MAX_PHOTOS ? (
        <InfoBanner
          tone="warning"
          message="Límite de 5 fotos por modelo. Elimina una foto para agregar otra."
        />
      ) : (
        <ThemedText variant="caption" color={Colors.textSecondary}>
          La primera foto será la principal. Máximo {MAX_PHOTOS}.
        </ThemedText>
      )}

      <PhotoManagerModal
        visible={isManagerOpen}
        modelName={modelName}
        photos={photos}
        onChange={onChange}
        onClose={() => setIsManagerOpen(false)}
      />

      <PhotoSourceSheet
        visible={isSheetOpen}
        modelName={modelName}
        remaining={MAX_PHOTOS - photos.length}
        onAdd={(added) => onChange([...photos, ...added].slice(0, MAX_PHOTOS))}
        onClose={() => setIsSheetOpen(false)}
      />
    </View>
  );
};

export default PhotoSlots;

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  slots: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  slot: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
});
