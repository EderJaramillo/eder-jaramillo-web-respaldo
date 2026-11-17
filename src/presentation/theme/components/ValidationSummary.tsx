import { Modal } from "react-native";
import AppBar from "./AppBar";
import InfoBanner from "./InfoBanner";
import ScreenLayout from "./ScreenLayout";
import ThemedButton from "./ThemedButton";
import ThemedText from "./ThemedText";

export interface Issue {
  message: string;
  // "warning" para avisos que no impiden seguir (por ejemplo, el producto se ocultó solo).
  tone?: "error" | "warning";
}

interface Props {
  visible: boolean;
  issues: Issue[];
  onClose: () => void;
}

const ValidationSummary = ({ visible, issues, onClose }: Props) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <ScreenLayout
      header={<AppBar title="Revisa estos datos" onBack={onClose} />}
      footer={<ThemedButton title="Volver al producto" onPress={onClose} />}
    >
      <ThemedText variant="title">Antes de continuar</ThemedText>
      {issues.map((issue) => (
        <InfoBanner
          key={issue.message}
          tone={issue.tone ?? "error"}
          message={issue.message}
        />
      ))}
    </ScreenLayout>
  </Modal>
);

export default ValidationSummary;
