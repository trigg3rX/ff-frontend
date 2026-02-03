"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FiZoomIn, FiZoomOut, FiMaximize2, FiChevronDown } from "react-icons/fi";
import { MdHistory } from "react-icons/md";
import { useWorkflow } from "@/context/WorkflowContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { CgRedo, CgUndo } from "react-icons/cg";

export function CanvasControls() {
  const { handleZoomIn, handleZoomOut, handleFitView, zoomLevel, undo, redo, canUndo, canRedo } = useWorkflow();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      // Use both mousedown and click for better compatibility
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Detect OS for keyboard shortcut display
  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const cmdKey = isMac ? "⌘" : "Ctrl";

  const menuItems = [
    {
      id: "zoom-in",
      label: "Zoom in",
      shortcut: `${cmdKey} +`,
      icon: FiZoomIn,
      onClick: () => {
        handleZoomIn();
      },
      disabled: false,
    },
    {
      id: "zoom-out",
      label: "Zoom out",
      shortcut: `${cmdKey} -`,
      icon: FiZoomOut,
      onClick: () => {
        handleZoomOut();
      },
      disabled: false,
    },
    {
      id: "zoom-to-fit",
      label: "Zoom to fit",
      shortcut: "D",
      icon: FiMaximize2,
      onClick: () => {
        handleFitView();
      },
      disabled: false,
    },
    {
      id: "zoom-to-selection",
      label: "Zoom to selection",
      shortcut: "F",
      icon: FiMaximize2,
      onClick: () => { },
      disabled: true,
    },
  ];

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2" ref={dropdownRef}>
      <div className="flex items-center gap-0">
        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="p-1 rounded-full text-white/80 hover:bg-white/5 transition-all duration-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Undo"
            >
              <CgUndo className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>Undo ({cmdKey}+Z)</p>
          </TooltipContent>
        </Tooltip>

        {/* Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="p-1 rounded-full text-white/80 hover:bg-white/5 transition-all duration-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Redo"
            >
              <CgRedo className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>Redo ({cmdKey}+Shift+Z)</p>
          </TooltipContent>
        </Tooltip>

        {/* Execution history - link to workflows page */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/workflows"
              className="p-1 rounded-full text-white/80 hover:bg-white/5 transition-all duration-200 flex items-center justify-center"
              aria-label="View execution history"
            >
              <MdHistory className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>Execution history</p>
          </TooltipContent>
        </Tooltip>

        {/* Zoom Level Indicator */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="px-3 py-1.5 rounded-full text-white/80 text-xs hover:bg-white/5 transition-all duration-200 flex items-center gap-2 cursor-pointer"
        >
          <span>{zoomLevel}%</span>
          <FiChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden min-w-[200px]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`w-full px-4 py-2.5 flex items-center justify-between text-xs transition-all duration-200 text-left ${item.disabled
                  ? "text-white/30 cursor-not-allowed"
                  : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <span className="text-xs text-white/50 font-normal">
                  {item.shortcut}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
