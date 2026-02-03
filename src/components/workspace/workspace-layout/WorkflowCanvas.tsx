"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnMove,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { useWorkflow } from "@/context/WorkflowContext";
import { nodeTypes as importedNodeTypes } from "../nodeTypes";

export interface WorkflowCanvasProps {
  className?: string;
  showBackground?: boolean;
  showMiniMap?: boolean;
  backgroundVariant?: BackgroundVariant;
  fitView?: boolean;
}

function WorkflowCanvasInner({
  className,
  showBackground = true,
  backgroundVariant = BackgroundVariant.Dots,
  fitView = true,
}: WorkflowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodesDelete,
    handleNodeClick,
    handlePaneClick,
    handleNodeContextMenu,
    handleEdgeContextMenu,
    handlePaneContextMenu,
    handleReactFlowInit,
    setZoomLevel,
  } = useWorkflow();

  const nodeTypes = importedNodeTypes;

  const handleNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const handleConnect = useCallback<OnConnect>(
    (connection) => {
      onConnect(connection);
    },
    [onConnect]
  );

  const handleMove = useCallback<OnMove>(
    (_event, viewport) => {
      setZoomLevel(Math.round(viewport.zoom * 100));
    },
    [setZoomLevel]
  );

  return (
    <div
      className={`w-full h-full min-h-[500px] rounded-xl border border-white/10 transition-all duration-300 bg-white/5 ${className || ""}`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        fitView={fitView}
        connectionMode={ConnectionMode.Loose}
        onInit={handleReactFlowInit}
        onMove={handleMove}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        nodesFocusable={true}
        deleteKeyCode={["Delete", "Backspace"]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        panOnScroll={false}
        panOnDrag={true}
        preventScrolling={false}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "#ffffff",
            strokeWidth: 0.5,
          },
        }}
        className="workflow-canvas"
      >
        {showBackground && (
          <Background
            variant={backgroundVariant}
            gap={20}
            size={2}
            color="rgba(255, 255, 255, 0.08)"
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
