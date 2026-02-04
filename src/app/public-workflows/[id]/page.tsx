import type { Metadata } from "next";
import { WorkflowProvider } from "@/context/WorkflowContext";
import { PublicWorkflowPreview } from "@/components/workspace/public-workflows/PublicWorkflowPreview";
import { getPublicWorkflow } from "@/utils/workflow-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    // Fetch workflow data for metadata
    const result = await getPublicWorkflow({ workflowId: id });

    if (!result.success || !result.data) {
      return {
        title: "Workflow Not Found - FlowForge",
        description: "The requested workflow could not be found.",
      };
    }

    const workflow = result.data;
    const description =
      workflow.description ||
      "Discover and use this automation workflow created by the community.";

    return {
      title: `${workflow.name} - FlowForge`,
      description,
      keywords: workflow.tags?.join(", "),
      openGraph: {
        title: workflow.name,
        description,
        type: "website",
        url: `/public-workflows/${id}`,
      },
      twitter: {
        card: "summary_large_image",
        title: workflow.name,
        description,
      },
    };
  } catch {
    // console.error("Error generating metadata:", error);
    return {
      title: "Public Workflow - FlowForge",
      description: "View this automation workflow.",
    };
  }
}

export default async function PublicWorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <WorkflowProvider>
        <PublicWorkflowPreview workflowId={id} />
      </WorkflowProvider>
    </div>
  );
}
