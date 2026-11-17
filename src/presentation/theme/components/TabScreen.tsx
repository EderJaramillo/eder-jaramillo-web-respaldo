import { Colors, spacing } from "@/config/theme/theme";
import { router, type Href } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "./BottomNav";
import { Toasts } from "./NoticesHost";

type Tab = "products" | "gallery" | "account";

const routes: Record<Tab, Href> = {
  products: "/products",
  gallery: "/gallery",
  account: "/account",
};

export const goToTab = (tab: Tab) => router.replace(routes[tab]);

interface Props {
  active: Tab;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

const TabScreen = ({ active, header, children, footer }: Props) => (
  <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    {header}
    <View style={styles.body}>
      {children}
      <Toasts />
    </View>
    {footer ? <View style={styles.footer}>{footer}</View> : null}
    <BottomNav
      active={active}
      onSelect={(tab) => tab !== active && goToTab(tab)}
    />
  </SafeAreaView>
);

export default TabScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  body: {
    flex: 1,
  },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
});
