import { Colors, iconStroke, radius, spacing } from "@/config/theme/theme";
import {
  clearUploads,
  retryUpload,
  type UploadItem,
} from "@/features/products/newProductSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Image } from "expo-image";
import { CircleCheck, LoaderCircle, RotateCw } from "lucide-react-native";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import AppBar from "../AppBar";
import InfoBanner from "../InfoBanner";
import ScreenLayout from "../ScreenLayout";
import ThemedButton from "../ThemedButton";
import ThemedText from "../ThemedText";

const statusText = (item: UploadItem) => {
  if (item.status === "done") return "Foto subida";
  if (item.status === "error") return "No se pudo subir";
  if (item.status === "pending") return "En espera";
  return `Subiendo · ${Math.round(item.progress * 100)}%`;
};

const UploadCard = ({ item }: { item: UploadItem }) => {
  const dispatch = useAppDispatch();
  const isError = item.status === "error";
  const Icon =
    item.status === "done" ? CircleCheck : isError ? RotateCw : LoaderCircle;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image source={item.uri} style={styles.thumb} contentFit="cover" />
        <View style={styles.flex}>
          <ThemedText variant="bodyStrong">{item.label}</ThemedText>
          <ThemedText
            variant="caption"
            color={isError ? Colors.danger : Colors.textSecondary}
          >
            {statusText(item)}
          </ThemedText>
        </View>
        <Pressable
          disabled={!isError}
          onPress={() => dispatch(retryUpload(item.key))}
          accessibilityRole={isError ? "button" : "image"}
          accessibilityLabel={
            isError ? "Reintentar esta foto" : statusText(item)
          }
          hitSlop={8}
        >
          <Icon
            size={24}
            color={isError ? Colors.danger : Colors.primary}
            strokeWidth={iconStroke}
            absoluteStrokeWidth
          />
        </Pressable>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.bar,
            { width: `${Math.round(item.progress * 100)}%` },
            isError && styles.barError,
          ]}
        />
      </View>
      {isError && (
        <ThemedButton
          title="Reintentar esta foto"
          variant="text"
          onPress={() => dispatch(retryUpload(item.key))}
        />
      )}
    </View>
  );
};

const UploadProgressModal = () => {
  const dispatch = useAppDispatch();
  const { uploads, uploadsTitle } = useAppSelector((s) => s.newProduct);
  const busy = uploads.some(
    (u) => u.status === "uploading" || u.status === "pending",
  );
  const hasError = uploads.some((u) => u.status === "error");
  const close = () => {
    dispatch(clearUploads());
  };

  return (
    <Modal
      visible={uploads.length > 0}
      animationType="slide"
      onRequestClose={() => {
        if (!busy) close();
      }}
    >
      <ScreenLayout
        header={
          <AppBar title="Subir fotos" onBack={busy ? undefined : close} />
        }
        footer={<ThemedButton title="Listo" disabled={busy} onPress={close} />}
      >
        <ThemedText variant="title">Fotos de {uploadsTitle}</ThemedText>
        <ThemedText color={Colors.textSecondary}>
          Cada foto se sube por separado. No cierres la app mientras termina.
        </ThemedText>
        {uploads.map((item) => (
          <UploadCard key={item.key} item={item} />
        ))}
        {hasError && !busy && (
          <InfoBanner
            tone="error"
            message="Una foto no se pudo subir. Tus otras fotos están guardadas."
          />
        )}
      </ScreenLayout>
    </Modal>
  );
};

export default UploadProgressModal;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: radius.md,
    shadowColor: "#291140",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  track: {
    height: 4,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: "hidden",
  },
  bar: {
    height: 4,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  barError: {
    backgroundColor: Colors.danger,
  },
});
