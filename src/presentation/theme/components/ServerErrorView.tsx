import { Colors, spacing } from "@/config/theme/theme";
import { CloudOff, RotateCw } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import EmptyState from "./EmptyState";
import InfoBanner from "./InfoBanner";
import ThemedButton from "./ThemedButton";

interface Props {
  detail?: string | null;
  onRetry: () => void;
}

const ServerErrorView = ({ detail, onRetry }: Props) => (
  <View style={styles.container}>
    <EmptyState
      icon={CloudOff}
      title="Algo no salió bien"
      description="No pudimos cargar la información de tu negocio. Tus productos siguen guardados. Intenta nuevamente en un momento."
    />
    <InfoBanner
      tone="error"
      message={detail || "No se pudo conectar con Suajam."}
    />
    <ThemedButton
      title="Intentar nuevamente"
      icon={RotateCw}
      onPress={onRetry}
    />
  </View>
);

export default ServerErrorView;

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: Colors.background,
  },
});
