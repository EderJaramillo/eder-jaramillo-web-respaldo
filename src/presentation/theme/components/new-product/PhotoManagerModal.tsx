import { Colors, iconStroke, radius, spacing } from "@/config/theme/theme";
import {
  MAX_PHOTOS,
  type DraftPhoto,
} from "@/features/products/newProductSlice";
import { Image } from "expo-image";
import { Camera, GripVertical, ImageIcon, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import AppBar from "../AppBar";
import ConfirmDialog from "../ConfirmDialog";
import InfoBanner from "../InfoBanner";
import ScreenLayout from "../ScreenLayout";
import ThemedButton from "../ThemedButton";
import ThemedText from "../ThemedText";
import PhotoSourceSheet from "./PhotoSourceSheet";

interface Props {
  visible: boolean;
  modelName: string;
  photos: DraftPhoto[];
  onChange: (photos: DraftPhoto[]) => void;
  onClose: () => void;
}

const ROW = 96;

const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const OrderRow = ({
  photo,
  index,
  count,
  onDragStart,
  onDragMove,
  onDragEnd,
  translate,
  isDragging,
  onDelete,
}: {
  photo: DraftPhoto;
  index: number;
  count: number;
  onDragStart: (index: number) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
  translate: Animated.AnimatedInterpolation<number> | number;
  isDragging: boolean;
  onDelete: () => void;
}) => {
  const handlers = useRef({ onDragStart, onDragMove, onDragEnd, index });
  useEffect(() => {
    handlers.current = { onDragStart, onDragMove, onDragEnd, index };
  });

  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () =>
        handlers.current.onDragStart(handlers.current.index),
      onPanResponderMove: (_, g) => handlers.current.onDragMove(g.dy),
      onPanResponderRelease: () => handlers.current.onDragEnd(),
      onPanResponderTerminate: () => handlers.current.onDragEnd(),
    }),
  );

  return (
    <Animated.View
      style={[
        styles.orderRow,
        isDragging && styles.dragging,
        { transform: [{ translateY: translate }] },
      ]}
    >
      <Image source={photo.uri} style={styles.orderThumb} contentFit="cover" />
      <View style={styles.flex}>
        {index === 0 ? (
          <>
            <View style={styles.badge}>
              <ImageIcon
                size={12}
                color={Colors.primary}
                strokeWidth={iconStroke}
                absoluteStrokeWidth
              />
              <ThemedText variant="caption" color={Colors.primary}>
                Principal
              </ThemedText>
            </View>
            <ThemedText variant="caption" color={Colors.textSecondary}>
              Primera foto del modelo
            </ThemedText>
          </>
        ) : (
          <ThemedText variant="bodyMedium">Foto {index + 1}</ThemedText>
        )}
        <Pressable
          onPress={onDelete}
          style={styles.deleteRow}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Trash2
            size={16}
            color={Colors.primary}
            strokeWidth={iconStroke}
            absoluteStrokeWidth
          />
          <ThemedText variant="label" color={Colors.primary}>
            Eliminar
          </ThemedText>
        </Pressable>
      </View>
      <View
        {...pan.panHandlers}
        style={styles.handle}
        accessibilityRole="adjustable"
        accessibilityLabel={`Mover foto ${index + 1} de ${count}`}
      >
        <GripVertical
          size={24}
          color={Colors.primary}
          strokeWidth={iconStroke}
          absoluteStrokeWidth
        />
      </View>
    </Animated.View>
  );
};

const PhotoManagerModal = ({
  visible,
  modelName,
  photos,
  onChange,
  onClose,
}: Props) => {
  const [mode, setMode] = useState<"grid" | "order">("grid");
  const [order, setOrder] = useState<DraftPhoto[]>(photos);
  const [toDelete, setToDelete] = useState<DraftPhoto | null>(null);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const [dy] = useState(() => new Animated.Value(0));
  const dragRef = useRef<{ from: number; to: number } | null>(null);

  const isFull = photos.length >= MAX_PHOTOS;

  const openOrder = () => {
    setOrder(photos);
    setMode("order");
  };

  const close = () => {
    setMode("grid");
    onClose();
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const key = toDelete.key;
    onChange(photos.filter((p) => p.key !== key));
    setOrder((current) => current.filter((p) => p.key !== key));
    setToDelete(null);
  };

  const preview = drag ? move(order, drag.from, drag.to) : order;

  const dialog = (
    <ConfirmDialog
      visible={toDelete !== null}
      icon={Trash2}
      title="¿Eliminar esta foto?"
      description="La foto se quitará del modelo. Si es la principal, la siguiente ocupará su lugar."
      confirmLabel="Eliminar foto"
      onConfirm={confirmDelete}
      onCancel={() => setToDelete(null)}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={mode === "order" ? () => setMode("grid") : close}
    >
      {mode === "grid" ? (
        <ScreenLayout
          header={<AppBar title="Fotos del modelo" onBack={close} />}
          footer={<ThemedButton title="Listo" onPress={close} />}
        >
          <ThemedText variant="title">
            {modelName} · {photos.length}/{MAX_PHOTOS} fotos
          </ThemedText>
          <View style={styles.grid}>
            {photos.map((photo, index) => (
              <Pressable
                key={photo.key}
                onPress={() => setToDelete(photo)}
                style={styles.tile}
                accessibilityRole="button"
                accessibilityLabel={
                  index === 0 ? "Foto principal" : `Foto ${index + 1}`
                }
                accessibilityHint="Pregunta si quieres eliminarla"
              >
                <Image
                  source={photo.uri}
                  style={styles.fill}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </View>
          {isFull && (
            <InfoBanner
              tone="warning"
              message="Límite de 5 fotos por modelo. Elimina una foto para agregar otra."
            />
          )}
          <ThemedButton
            title="Agregar foto"
            variant="outline"
            icon={Camera}
            disabled={isFull}
            onPress={() => setIsSourceOpen(true)}
          />
          {photos.length > 1 && (
            <ThemedButton
              title="Ordenar fotos"
              variant="text"
              onPress={openOrder}
            />
          )}
          <ThemedText variant="caption" color={Colors.textSecondary}>
            La primera foto del primer modelo será la miniatura del producto.
          </ThemedText>
          <PhotoSourceSheet
            visible={isSourceOpen}
            modelName={modelName}
            remaining={MAX_PHOTOS - photos.length}
            onAdd={(added) =>
              onChange([...photos, ...added].slice(0, MAX_PHOTOS))
            }
            onClose={() => setIsSourceOpen(false)}
          />
          {dialog}
        </ScreenLayout>
      ) : (
        <ScreenLayout
          header={
            <AppBar title="Ordenar fotos" onBack={() => setMode("grid")} />
          }
          footer={
            <ThemedButton
              title="Guardar orden"
              onPress={() => {
                onChange(order);
                setMode("grid");
              }}
            />
          }
        >
          <ThemedText variant="title">Fotos del modelo {modelName}</ThemedText>
          <InfoBanner message="Mantén presionada una foto y arrástrala para cambiar su lugar." />
          <View style={{ height: preview.length * ROW }}>
            {preview.map((photo, index) => {
              const isDragging =
                drag !== null && order[drag.from].key === photo.key;
              return (
                <View
                  key={photo.key}
                  style={[
                    styles.slotRow,
                    { top: index * ROW, zIndex: isDragging ? 1 : 0 },
                  ]}
                >
                  <OrderRow
                    photo={photo}
                    index={index}
                    count={preview.length}
                    isDragging={isDragging}
                    translate={
                      isDragging && drag
                        ? Animated.subtract(dy, (drag.to - drag.from) * ROW)
                        : 0
                    }
                    onDragStart={(from) => {
                      dy.setValue(0);
                      dragRef.current = { from, to: from };
                      setDrag(dragRef.current);
                    }}
                    onDragMove={(value) => {
                      const current = dragRef.current;
                      if (!current) return;
                      dy.setValue(value);
                      const to = Math.max(
                        0,
                        Math.min(
                          order.length - 1,
                          current.from + Math.round(value / ROW),
                        ),
                      );
                      if (to !== current.to) {
                        dragRef.current = { from: current.from, to };
                        setDrag(dragRef.current);
                      }
                    }}
                    onDragEnd={() => {
                      const current = dragRef.current;
                      dragRef.current = null;
                      if (current)
                        setOrder((list) =>
                          move(list, current.from, current.to),
                        );
                      setDrag(null);
                      dy.setValue(0);
                    }}
                    onDelete={() => setToDelete(photo)}
                  />
                </View>
              );
            })}
          </View>
          {dialog}
        </ScreenLayout>
      )}
    </Modal>
  );
};

export default PhotoManagerModal;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: spacing.xs,
  },
  fill: {
    width: "100%",
    height: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tile: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  slotRow: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  orderRow: {
    height: ROW - spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: radius.md,
  },
  dragging: {
    zIndex: 1,
    borderColor: Colors.primary,
    shadowColor: "#291140",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  orderThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
  },
  badge: {
    alignSelf: "flex-start",
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    backgroundColor: Colors.selected,
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  handle: {
    width: 48,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
