"use client";

import React from "react";
import type { BlockDefinition } from "@/blocks/types";

interface DraggableBlockProps {
  block: BlockDefinition;
  onDragStart?: (block: BlockDefinition, event: React.DragEvent) => void;
  onClick?: (block: BlockDefinition) => void;
  disabled?: boolean;
}

export const DraggableBlock = React.memo(function DraggableBlock({
  block,
  onDragStart,
  onClick,
  disabled = false,
}: DraggableBlockProps) {

  return (
    <div> This is draggable block</div>
  );
});
