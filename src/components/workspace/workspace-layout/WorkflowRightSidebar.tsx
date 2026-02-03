"use client";

import { useState, useMemo } from "react";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { usePrivy } from "@privy-io/react-auth";
import { useWorkflow } from "@/context/WorkflowContext";
import { useBlock } from "@/blocks/context";
import { getConfigComponent, resolveConfigProps } from "@/blocks/configs/registry";
import { GenericConfig } from "@/blocks/configs/GenericConfig";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { SwapProvider } from "@/types/swap";
import {
  LuTrash2,
  LuX,
} from "react-icons/lu";

export function WorkflowRightSidebar() {
  const {
    selectedNode,
    handleNodeDataChange,
    deleteNodes,
    setSelectedNode,
  } = useWorkflow();
  const { authenticated, login } = usePrivy();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Use block context for lookups - must be called before any early returns
  const { getBlockById, getBlockByNodeType } = useBlock();

  // Memoize config component to avoid creating components during render
  const { ConfigComponent, configProps, blockDefinition, nodeData, isStartNode } = useMemo(() => {
    if (!selectedNode) {
      return {
        ConfigComponent: null,
        configProps: null,
        blockDefinition: null,
        nodeData: {},
        isStartNode: false,
      };
    }

    const blockId = selectedNode.data?.blockId as string | undefined;
    const nodeType = selectedNode.type || "";

    // Try to get block by ID first, then by node type
    const blockDef =
      (blockId && getBlockById(blockId)) ||
      (nodeType && getBlockByNodeType(nodeType)) ||
      null;

    const data = selectedNode.data || {};
    const isStart = nodeType === "start" || blockId === "start";

    // Get config component from registry
    const Component = getConfigComponent(nodeType, blockId);

    // Resolve props for config component
    const props = Component
      ? resolveConfigProps(nodeType, blockId, {
        nodeData: { ...data, id: selectedNode.id },
        handleDataChange: (updates: Record<string, unknown>) => {
          if (selectedNode?.id) {
            handleNodeDataChange(selectedNode.id, {
              ...data,
              ...updates,
            });
          }
        },
        authenticated,
        login,
        nodeId: selectedNode.id,
        // Handle forcedProvider for LiFi blocks
        forcedProvider:
          (nodeType === "lifi" || blockId === "lifi")
            ? SwapProvider.LIFI
            : undefined,
      })
      : null;

    return {
      ConfigComponent: Component,
      configProps: props,
      blockDefinition: blockDef,
      nodeData: data,
      isStartNode: isStart,
    };
  }, [selectedNode, getBlockById, getBlockByNodeType, authenticated, login, handleNodeDataChange]);

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Typography variant="body" className="text-muted-foreground">
            No block selected
          </Typography>
          <Typography variant="caption" className="text-muted-foreground mt-2">
            Click on a block to view and edit its settings
          </Typography>
        </div>
      </div>
    );
  }

  // Batched data change handler
  const handleBatchDataChange = (updates: Record<string, unknown>) => {
    if (selectedNode?.id) {
      handleNodeDataChange(selectedNode.id, {
        ...nodeData,
        ...updates,
      });
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedNode?.id) {
      deleteNodes([selectedNode.id]);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const quickTips = [
    "Drag blocks from the left panel onto the canvas",
    "Connect blocks by dragging from output to input ports",
    "Click any block to configure its settings",
  ];

  return (
    <>
      <div className="max-h-full overflow-y-auto p-4 space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-white/60 flex items-center justify-between gap-4">
          <div className="flex flex-col items-start gap-1">
            <Typography
              variant="h3"
            >
              {blockDefinition?.label || "Block Settings"}
            </Typography>
            <Typography
              variant="caption"
            >
              {blockDefinition?.description ||
                "Configure parameters for the selected block"}
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Close Button - Next to Delete */}
            <Button
              onClick={() => setSelectedNode(null)}
              className="md:hidden w-9 h-9 p-0 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm hover:shadow"
              aria-label="Close settings"
            >
              <LuX className="w-4 h-4" />
            </Button>
            {/* Delete Button - Hidden for Start node */}
            {!isStartNode && (
              <Button
                onClick={handleDeleteClick}
                className="w-9 h-9 p-0 rounded-full"
                aria-label="Delete block"
              >
                <LuTrash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Start Node - Simple info display (special handling) */}
        {isStartNode ? (
          <SimpleCard className="p-5">
            <div className="text-center mb-6">
              <Typography
                variant="h5"
                className="font-semibold text-foreground mb-2"
              >
                Workflow Start
              </Typography>
              <Typography
                variant="bodySmall"
                className="text-muted-foreground"
              >
                This is where your automation begins. Connect blocks from the left panel to build your workflow.
              </Typography>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Typography
                variant="bodySmall"
                className="font-medium text-foreground mb-3"
              >
                Quick Tips
              </Typography>
              <div className="space-y-2.5">
                {quickTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <Typography
                      variant="caption"
                      className="text-muted-foreground"
                    >
                      {tip}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          </SimpleCard>
        ) : ConfigComponent && configProps ? (
          /* Render config component from registry */
          <ConfigComponent {...configProps} />
        ) : (
          /* Fallback to generic config */
          <GenericConfig
            nodeData={{ ...nodeData, id: selectedNode.id }}
            handleDataChange={handleBatchDataChange}
            nodeId={selectedNode.id}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
