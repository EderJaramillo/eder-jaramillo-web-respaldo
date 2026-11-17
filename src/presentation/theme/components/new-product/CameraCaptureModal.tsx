import {
  Colors,
  fonts,
  iconStroke,
  radius,
  spacing,
} from "@/config/theme/theme";
import {
  MAX_PHOTOS,
  newKey,
  type DraftPhoto,
} from "@/features/products/newProductSlice";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import { Image } from "expo-image";
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  RotateCw,
  SwitchCamera,
  Zap,
  ZapOff,
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PermissionView from "../PermissionView";
import ThemedButton from "../ThemedButton";
import ThemedText from "../ThemedText";

interface Props {
  visible: boolean;
  modelName: string;
  remaining: number;
  onDone: (photos: DraftPhoto[]) => void;
  onClose: () => void;
}

const SIZE = 1080;

async function squarePhoto(uri: string, rotation: number) {
  const rotated = await manipulateAsync(
    uri,
    rotation ? [{ rotate: rotation }] : [],
  );
  const side = Math.min(rotated.width, rotated.height);
  const result = await manipulateAsync(
    rotated.uri,
    [
      {
        crop: {
          originX: Math.round((rotated.width - side) / 2),
          originY: Math.round((rotated.height - side) / 2),
          width: side,
          height: side,
        },
      },
      { resize: { width: Math.min(side, SIZE) } },
    ],
    { compress: 0.8, format: SaveFormat.JPEG },
  );
  return result.uri;
}

const CameraCaptureModal = ({
  visible,
  modelName,
  remaining,
  onDone,
  onClose,
}: Props) => {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState(false);
  const [taken, setTaken] = useState<DraftPhoto[]>([]);
  const [review, setReview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  const used = MAX_PHOTOS - remaining + taken.length;
  const isFull = taken.length >= remaining;

  const reset = () => {
    setTaken([]);
    setReview(null);
    setRotation(0);
  };

  const close = () => {
    reset();
    onClose();
  };

  const finish = () => {
    const photos = taken;
    reset();
    onDone(photos);
  };

  const shoot = async () => {
    if (!camera.current || isBusy || isFull) return;
    setIsBusy(true);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.8 });
      if (picture?.uri) {
        setRotation(0);
        setReview(picture.uri);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const usePhoto = async () => {
    if (!review) return;
    setIsBusy(true);
    try {
      const uri = await squarePhoto(review, rotation);
      setTaken((current) => [
        ...current,
        { key: newKey("photo"), uri, source: "device", uploaded: false },
      ]);
      setReview(null);
    } finally {
      setIsBusy(false);
    }
  };

  const header = (
    title: string,
    onBack: () => void,
    action?: { icon: typeof Zap; label: string; onPress: () => void },
  ) => (
    <View style={styles.bar}>
      <Pressable
        onPress={onBack}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Volver"
      >
        <ArrowLeft
          size={24}
          color={Colors.surface}
          strokeWidth={iconStroke}
          absoluteStrokeWidth
        />
      </Pressable>
      <ThemedText
        variant="subtitle"
        color={Colors.surface}
        style={styles.flex}
        numberOfLines={1}
      >
        {title}
      </ThemedText>
      {action ? (
        <Pressable
          onPress={action.onPress}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <action.icon
            size={24}
            color={Colors.surface}
            strokeWidth={iconStroke}
            absoluteStrokeWidth
          />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );

  const guides = (
    <View pointerEvents="none" style={styles.guide}>
      <View style={[styles.line, styles.vertical, { left: "33.3%" }]} />
      <View style={[styles.line, styles.vertical, { left: "66.6%" }]} />
      <View style={[styles.line, styles.horizontal, { top: "33.3%" }]} />
      <View style={[styles.line, styles.horizontal, { top: "66.6%" }]} />
    </View>
  );

  let content;
  if (!permission?.granted) {
    // Si ya se negó y el teléfono no lo vuelve a preguntar, solo queda abrir los ajustes.
    const blocked = permission?.canAskAgain === false;
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={close}>
        {blocked ? (
          <PermissionView
            barTitle="Permiso de cámara"
            icon={CameraOff}
            title="Tu cámara está desactivada"
            description="Activa el acceso a Cámara en los ajustes de tu teléfono. También puedes elegir una foto de tu galería."
            actionLabel="Abrir ajustes"
            onAction={() => Linking.openSettings()}
            onDismiss={close}
          />
        ) : (
          <PermissionView
            barTitle="Permisos de fotos"
            icon={Camera}
            title="Permite usar tu cámara"
            description="Suajam necesita tu cámara para tomar fotos de tus productos y escanear códigos de barras."
            privacyNote
            systemNote
            actionLabel="Permitir cámara"
            onAction={requestPermission}
            onDismiss={close}
          />
        )}
      </Modal>
    );
  } else if (review) {
    content = (
      <View style={styles.body}>
        {header("Revisa tu foto", () => setReview(null))}
        <View style={styles.content}>
          <ThemedText
            variant="caption"
            color={Colors.surface}
            style={styles.center}
          >
            Recorte 1:1 · Ajusta antes de usar
          </ThemedText>
          <View style={styles.viewer}>
            <Image
              source={review}
              style={[
                styles.fill,
                { transform: [{ rotate: `${rotation}deg` }] },
              ]}
              contentFit="cover"
            />
            {guides}
          </View>
          <ThemedButton
            title="Rotar"
            variant="outline"
            icon={RotateCw}
            onPress={() => setRotation((r) => (r + 90) % 360)}
          />
          <ThemedText
            variant="caption"
            color={Colors.surface}
            style={styles.center}
          >
            Tu foto se guardará en formato cuadrado.
          </ThemedText>
        </View>
        <View style={styles.footer}>
          <View style={styles.flex}>
            <ThemedButton
              title="Repetir"
              variant="outline"
              onPress={() => setReview(null)}
            />
          </View>
          <View style={styles.flex}>
            <ThemedButton
              title="Usar foto"
              loading={isBusy}
              loadingTitle="Guardando…"
              onPress={usePhoto}
            />
          </View>
        </View>
      </View>
    );
  } else {
    const last = taken.at(-1);
    content = (
      <View style={styles.body}>
        {header(`Foto del modelo ${modelName}`, close, {
          icon: flash ? Zap : ZapOff,
          label: flash ? "Apagar flash" : "Encender flash",
          onPress: () => setFlash((f) => !f),
        })}
        <View style={styles.content}>
          <ThemedText
            variant="caption"
            color={Colors.surface}
            style={styles.center}
          >
            Centra el producto. Puedes tomar varias fotos.
          </ThemedText>
          <View style={styles.viewer}>
            <CameraView
              ref={camera}
              style={styles.fill}
              facing={facing}
              flash={flash ? "on" : "off"}
            />
            {guides}
          </View>
          <View style={styles.controls}>
            {last ? (
              <Image
                source={last.uri}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={styles.thumb} />
            )}
            <View style={[styles.flex, styles.shutterBox]}>
              <Pressable
                onPress={shoot}
                disabled={isBusy || isFull}
                style={[styles.shutter, (isBusy || isFull) && styles.disabled]}
                accessibilityRole="button"
                accessibilityLabel="Tomar foto"
              >
                <View style={styles.shutterInner} />
              </Pressable>
            </View>
            <Pressable
              onPress={() =>
                setFacing((f) => (f === "back" ? "front" : "back"))
              }
              style={styles.thumbButton}
              accessibilityRole="button"
              accessibilityLabel="Cambiar cámara"
            >
              <SwitchCamera
                size={28}
                color={Colors.surface}
                strokeWidth={iconStroke}
                absoluteStrokeWidth
              />
            </Pressable>
          </View>
          <View style={styles.statusRow}>
            <ThemedText
              variant="caption"
              color={Colors.surface}
              style={styles.flex}
            >
              {used}/{MAX_PHOTOS} fotos{isFull ? " · Ya no caben más" : ""}
            </ThemedText>
            <Pressable
              onPress={finish}
              disabled={taken.length === 0}
              style={[styles.done, taken.length === 0 && styles.disabled]}
              accessibilityRole="button"
            >
              <Text style={styles.doneText}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={review ? () => setReview(null) : close}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {content}
      </SafeAreaView>
    </Modal>
  );
};

export default CameraCaptureModal;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.scannerBackground,
  },
  body: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  bar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  center: {
    textAlign: "center",
  },
  viewer: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  fill: {
    width: "100%",
    height: "100%",
  },
  guide: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  line: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  vertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  horizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  thumbButton: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBox: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.surface,
  },
  disabled: {
    opacity: 0.4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  done: {
    width: 72,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: Colors.surface,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: Colors.surface,
  },
});
