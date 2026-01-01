import { FeatureContainer } from "@/features/image-generation";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";

export default function Home() {
  return (
    <DashboardLayout>
      <FeatureContainer />
    </DashboardLayout>
  );
}
