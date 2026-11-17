import { Colors, iconStroke, radius, spacing } from "@/config/theme/theme";
import { logout } from "@/features/auth/authSlice";
import { roleLabels } from "@/features/business/businessTypes";
import AppBar from "@/presentation/theme/components/AppBar";
import ConfirmDialog from "@/presentation/theme/components/ConfirmDialog";
import InfoBanner from "@/presentation/theme/components/InfoBanner";
import TabScreen from "@/presentation/theme/components/TabScreen";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedText from "@/presentation/theme/components/ThemedText";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActiveBusiness } from "@/store/selectors";
import Constants from "expo-constants";
import {
  CircleUserRound,
  Info,
  LogOut,
  Mail,
  Smartphone,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const InfoRow = ({
  icon: Icon,
  title,
  subtitle,
  trailing: Trailing,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  trailing: LucideIcon;
}) => (
  <View style={styles.row}>
    <Icon size={24} color={Colors.primary} strokeWidth={iconStroke} absoluteStrokeWidth />
    <View style={styles.flex}>
      <ThemedText variant="bodyMedium">{title}</ThemedText>
      <ThemedText variant="caption" color={Colors.textSecondary}>
        {subtitle}
      </ThemedText>
    </View>
    <Trailing size={22} color={Colors.textSecondary} strokeWidth={iconStroke} absoluteStrokeWidth />
  </View>
);

// Fase 6 / 01 (cuenta), 03 (cerrar sesión) y 04 (sin conexión). Cambiar de negocio no se
// incluye por ahora: cada usuario tiene un solo negocio.
const AccountScreen = () => {
  const dispatch = useAppDispatch();
  const business = useAppSelector(selectActiveBusiness);
  const user = useAppSelector((s) => s.auth.user);
  const isOffline = useAppSelector((s) => s.products.isOffline);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Tu cuenta";
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <TabScreen
      active="account"
      header={<AppBar title="Cuenta" actionIcon={CircleUserRound} actionLabel="Cuenta" />}
      footer={
        <ThemedButton
          title="Cerrar sesión"
          variant="text"
          icon={LogOut}
          onPress={() => setIsLogoutOpen(true)}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        {isOffline && (
          <InfoBanner
            tone="warning"
            message="Sin conexión. Conéctate para guardar cambios."
          />
        )}

        <View style={styles.businessCard}>
          <Store size={32} color={Colors.primary} strokeWidth={iconStroke} absoluteStrokeWidth />
          <ThemedText variant="title">{business?.tenant_name ?? "Tu negocio"}</ThemedText>
          {business && (
            <ThemedText variant="caption" color={Colors.primary}>
              {business.tenant_slug} · {roleLabels[business.role] ?? business.role}
            </ThemedText>
          )}
        </View>

        <View style={styles.card}>
          <InfoRow icon={UserRound} title={fullName} subtitle={user?.email ?? ""} trailing={Mail} />
          <InfoRow
            icon={Smartphone}
            title="Versión de la app"
            subtitle={`Suajam Catálogo · ${version}`}
            trailing={Info}
          />
        </View>

        <InfoBanner message="Tu catálogo siempre pertenece al negocio actual." />
      </ScrollView>

      <ConfirmDialog
        visible={isLogoutOpen}
        icon={LogOut}
        title="¿Cerrar sesión?"
        description="Tus productos y cambios guardados seguirán en tu negocio. Necesitarás entrar de nuevo para continuar."
        confirmLabel="Cerrar sesión"
        loading={isLeaving}
        onConfirm={async () => {
          setIsLeaving(true);
          await dispatch(logout());
          setIsLeaving(false);
          setIsLogoutOpen(false);
        }}
        onCancel={() => setIsLogoutOpen(false)}
      />
    </TabScreen>
  );
};

export default AccountScreen;

const cardBase = {
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: radius.md,
  shadowColor: "#291140",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 1,
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  businessCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: Colors.selected,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: radius.md,
  },
  card: {
    ...cardBase,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
