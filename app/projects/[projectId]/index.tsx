import { BusinessProjectWorkspace } from "@/src/business-project/BusinessProjectWorkspace";
import { findBusinessProjectById } from "@/src/business-project/mock";
import { useLocalSearchParams } from "expo-router";

export default function BusinessProjectDetailScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = findBusinessProjectById(projectId);

  return <BusinessProjectWorkspace project={project} moduleId="overview" />;
}
