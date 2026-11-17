import { Colors, iconStroke, radius, spacing } from "@/config/theme/theme";
import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import AppBar from "./AppBar";
import InfoBanner from "./InfoBanner";
import ScreenLayout from "./ScreenLayout";
import ThemedButton from "./ThemedButton";
import ThemedText from "./ThemedText";

interface Props {
  barTitle: string;
  icon: LucideIcon;
  title: string;
  description: string;
  privacyNote?: boolean;
  // "Después de continuar, tu teléfono mostrará la solicitud de permiso."
  systemNote?: boolean;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}

const PermissionView = ({
  barTitle,
  icon: Icon,
  title,
  description,
  privacyNote = false,
  systemNote = false,
  actionLabel,
  onAction,
  onDismiss,
}: Props) => (
  <ScreenLayout
    header={<AppBar title={barTitle} onBack={onDismiss} />}
    footer={
      <View style={styles.footer}>
        <ThemedButton title={actionLabel} onPress={onAction} />
        <ThemedButton title="Ahora no" variant="text" onPress={onDismiss} />
      </View>
    }
  >
    <View style={styles.hero}>
      <View style={styles.iconCircle}>
        <Icon
          size={40}
          color={Colors.primary}
          strokeWidth={iconStroke}
          absoluteStrokeWidth
        />
      </View>
      <ThemedText variant="title" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText color={Colors.textSecondary} style={styles.center}>
        {description}
      </ThemedText>
    </View>
    {privacyNote && (
      <InfoBanner message="Solo usaremos tus fotos para el catálogo de tu negocio." />
    )}
    {systemNote && (
      <View style={styles.note}>
        <ThemedText variant="caption" color={Colors.textSecondary}>
          Después de continuar, tu teléfono mostrará la solicitud de permiso.
        </ThemedText>
      </View>
    )}
  </ScreenLayout>
);

export default PermissionView;

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.selected,
  },
  center: {
    textAlign: "center",
  },
  note: {
    padding: spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: radius.md,
  },
  footer: {
    gap: spacing.xs,
  },
});
