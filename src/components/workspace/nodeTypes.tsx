/**
 * Node Types Configuration
 * Auto-generated node type registry for React Flow
 * Uses block registry for auto-discovery - special cases override defaults
 */

import React from "react";
import { Position, NodeTypes } from "reactflow";
import type { NodeProps } from "reactflow";
import { BaseNode } from "@/blocks/nodes/BaseNode";
import { WalletNode } from "@/blocks/nodes/WalletNode";
import { StartNode } from "@/blocks/nodes/StartNode";
import { IfNode } from "@/blocks/nodes/IfNode";
import { SwitchNode } from "@/blocks/nodes/SwitchNode";
import { getAllBlocks, discoverNodeComponents } from "@/blocks/registry";

/**
 * Default configuration for node handles
 */
export const DEFAULT_HANDLE_CONFIG = {
  showHandles: true,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
} as const;

/**
 * Stable node wrapper components
 * Defined as named functions with displayName for React DevTools
 * These are created once at module load time, not on each render
 */

// Base node wrapper - used for most node types
const BaseNodeWrapper: React.FC<NodeProps> = (props) => (
  <BaseNode {...props} {...DEFAULT_HANDLE_CONFIG} />
);
BaseNodeWrapper.displayName = "BaseNodeWrapper";

// Wallet node wrapper - specialized for wallet nodes
const WalletNodeWrapper: React.FC<NodeProps> = (props) => (
  <WalletNode {...props} {...DEFAULT_HANDLE_CONFIG} />
);
WalletNodeWrapper.displayName = "WalletNodeWrapper";

// Start node wrapper - specialized for the workflow start point
const StartNodeWrapper: React.FC<NodeProps> = (props) => (
  <StartNode {...props} sourcePosition={Position.Right} />
);
StartNodeWrapper.displayName = "StartNodeWrapper";

// If node wrapper - specialized for conditional branching
const IfNodeWrapper: React.FC<NodeProps> = (props) => (
  <IfNode {...props} {...DEFAULT_HANDLE_CONFIG} />
);
IfNodeWrapper.displayName = "IfNodeWrapper";

// Switch node wrapper - specialized for multi-branch routing
const SwitchNodeWrapper: React.FC<NodeProps> = (props) => (
  <SwitchNode {...props} {...DEFAULT_HANDLE_CONFIG} />
);
SwitchNodeWrapper.displayName = "SwitchNodeWrapper";

/**
 * Node type registry
 * Auto-generated from discovered node components and block registry
 * 
 * Priority:
 * 1. Explicit overrides (Start, If, Switch, Wallet)
 * 2. Auto-discovered node components (from nodes/ folder)
 * 3. Auto-generated from block registry (defaults to BaseNode)
 */
export const nodeTypes: NodeTypes = {
  // Generic base node fallback
  base: BaseNodeWrapper,
};

// Step 1: Add auto-discovered node components (from nodes/ folder)
const discoveredNodes = discoverNodeComponents();
for (const [nodeType, component] of discoveredNodes.entries()) {
  // Wrap discovered components with default handle config
  nodeTypes[nodeType] = ((props: NodeProps) => (
    React.createElement(component, { ...props, ...DEFAULT_HANDLE_CONFIG })
  )) as React.FC<NodeProps>;
}

// Step 2: Explicit overrides for special nodes (take precedence over discovered)
nodeTypes.start = StartNodeWrapper;
nodeTypes.if = IfNodeWrapper;
nodeTypes.switch = SwitchNodeWrapper;
nodeTypes["wallet-node"] = WalletNodeWrapper;

// Step 3: Auto-generate node types from block registry (defaults to BaseNode)
const allBlocks = getAllBlocks();
for (const block of allBlocks) {
  if (block.nodeType && !nodeTypes[block.nodeType]) {
    // Only add if not already defined (discovered/overrides take precedence)
    nodeTypes[block.nodeType] = BaseNodeWrapper;
  }
}

/**
 * List of available node type keys
 * Useful for validation and type guards
 */
export const NODE_TYPE_KEYS = Object.keys(nodeTypes);

/**
 * Type guard to check if a string is a valid node type
 */
export function isValidNodeType(type: string): boolean {
  return NODE_TYPE_KEYS.includes(type);
}
