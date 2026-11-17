import { useLocalSearchParams } from "expo-router";
import EditLoader from "./sections/EditLoader";
import MoreSectionsScreen from "./sections/MoreSectionsScreen";

const ProductMoreScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <EditLoader productId={Number(id)}>
      {() => <MoreSectionsScreen />}
    </EditLoader>
  );
};

export default ProductMoreScreen;
