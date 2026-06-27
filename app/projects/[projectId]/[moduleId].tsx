import { BusinessProjectWorkspace } from "@/src/business-project/BusinessProjectWorkspace";
import { BusinessProjectService } from "@/services/business-project";
import type { BusinessProject } from "@/src/business-project/types";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function BusinessProjectModuleScreen() {
  const { projectId, moduleId } = useLocalSearchParams<{ projectId: string; moduleId: string }>();
  const [project, setProject] = useState<BusinessProject | null>(null);

  useEffect(() => {
    let active = true;
    BusinessProjectService.getById(projectId)
      .then((data) => {
        if (active) setProject(data);
      })
      .catch((error) => console.log("BUSINESS PROJECT MODULE ERROR:", error));
    return () => {
      active = false;
    };
  }, [projectId]);

  if (!project) {
    return (
      <View style={{ flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#67e8f9" />
      </View>
    );
  }

  return <BusinessProjectWorkspace project={project} moduleId={moduleId} />;
}
