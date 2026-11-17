import { Colors, iconStroke, radius, spacing } from "@/config/theme/theme";
import { logout } from "@/features/auth/authSlice";
import {
  dismissSessionExpired,
  hideToast,
  type Toast,
} from "@/features/notices/noticesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { CircleCheck, Info } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import ConfirmDialog from "./ConfirmDialog";
import ThemedText from "./ThemedText";

const TOAST_MS = 3000;

const ToastItem = ({ toast }: { toast: Toast }) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const timer = setTimeout(() => dispatch(hideToast(toast.id)), TOAST_MS);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <View
      style={styles.toast}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <CircleCheck
        size={18}
        color={Colors.successText}
        strokeWidth={iconStroke}
        absoluteStrokeWidth
      />
      <ThemedText
        variant="caption"
        color={Colors.successText}
        style={styles.flex}
      >
        {toast.message}
      </ThemedText>
    </View>
  );
};

export const Toasts = () => {
  const toasts = useAppSelector((s) => s.notices.toasts);

  return (
    <View pointerEvents="none" style={styles.toasts}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
};

const NoticesHost = () => {
  const dispatch = useAppDispatch();
  const sessionExpired = useAppSelector((s) => s.notices.sessionExpired);

  return (
    <ConfirmDialog
      visible={sessionExpired}
      icon={Info}
      title="Tu sesión expiró"
      description="Por seguridad, inicia sesión nuevamente. Tus cambios guardados no se pierden."
      confirmLabel="Ir a iniciar sesión"
      confirmVariant="primary"
      onConfirm={() => {
        dispatch(dismissSessionExpired());
        dispatch(logout());
      }}
      onCancel={() => dispatch(dismissSessionExpired())}
    />
  );
};

export default NoticesHost;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  toasts: {
    position: "absolute",
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
    zIndex: 10,
    elevation: 10,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: Colors.successBackground,
    shadowColor: "#291140",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
