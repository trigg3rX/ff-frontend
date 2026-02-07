"use client";

import { useState, useMemo } from "react";
import { LuX, LuSave, LuLock, LuGlobe, LuTag } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { Label } from "@/components/ui/Label";
import { generateTagsFromNodes } from "@/utils/workflow-tags";
import { WORKFLOW_CONSTANTS } from "@/constants/workflow";
import type { Node } from "reactflow";

interface SaveWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (params: {
        workflowName: string;
        isPublic: boolean;
        description?: string;
        tags?: string[];
    }) => void;
    workflowName: string;
    currentDescription?: string;
    nodes: Node[];
    currentVersion?: number;
    currentWorkflowId?: string | null;
    currentTags?: string[];
    isPublic?: boolean;
}

export function SaveWorkflowModal({
    isOpen,
    onClose,
    onSave,
    workflowName,
    currentDescription = "",
    nodes,
    currentVersion = 1,
    currentWorkflowId,
    // currentTags = [], // Not currently used as we auto-generate
    isPublic = false,
}: SaveWorkflowModalProps) {
    const [editedName, setEditedName] = useState(workflowName);
    const [visibility, setVisibility] = useState<"private" | "public">(isPublic ? "public" : "private");
    const [description, setDescription] = useState(currentDescription);
    const [errors, setErrors] = useState<{
        name?: string;
        description?: string;
        tags?: string;
    }>({});

    // Auto-generate tags from nodes
    const autoTags = useMemo(() => generateTagsFromNodes(nodes), [nodes]);

    const validate = (): boolean => {
        const newErrors: {
            name?: string;
            description?: string;
            tags?: string;
        } = {};

        // Validate workflow name
        if (!editedName.trim()) {
            newErrors.name = "Workflow name is required";
        }

        if (visibility === "public") {
            if (!description.trim()) {
                newErrors.description = "Description is required for public workflows";
            }
            if (autoTags.length === 0) {
                newErrors.tags =
                    "Workflow must have at least one node to generate tags";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) {
            return;
        }

        onSave({
            workflowName: editedName.trim(),
            isPublic: visibility === "public",
            description: description.trim() || undefined,
            tags:
                visibility === "public" && autoTags.length > 0 ? autoTags : undefined,
        });
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-workflow-title"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className="relative z-50 w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close — absolute to modal */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 rounded-lg p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
                    aria-label="Close"
                >
                    <LuX className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="px-6 pt-5 pb-4">
                    <h2
                        id="save-workflow-title"
                        className="text-xl font-semibold text-zinc-100 text-center py-4"
                    >
                        Save Workflow<span className="ml-1 text-xs text-amber-600">({currentWorkflowId ? `v.${currentVersion + 1}` : "New"})</span>
                    </h2>
                </div>

                {/* Body */}
                <div className="px-6 pb-5 space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto">
                    {/* Workflow Name */}
                    <FormInput
                        id="workflow-name"
                        label="Workflow Name"
                        required
                        type="text"
                        value={editedName}
                        onValueChange={(value) => {
                            setEditedName(value);
                            setErrors({ ...errors, name: undefined });
                        }}
                        placeholder="e.g. Email digest, Data sync..."
                        error={errors.name}
                        className="bg-zinc-900/80 border-zinc-700 focus:border-amber-500/50 focus:ring-amber-500/20"
                    />

                    {/* Visibility — card-style toggle */}
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Visibility</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setVisibility("private")}
                                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all ${visibility === "private"
                                    ? "border-amber-500/50 bg-amber-500/10 text-zinc-100"
                                    : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/50"
                                    }`}
                            >
                                <LuLock className={`h-6 w-6 ${visibility === "private" ? "text-amber-500" : "text-zinc-500"}`} />
                                <div>
                                    <span className="block text-sm font-medium text-center">Private</span>
                                    <span className="block text-xs opacity-80 mt-0.5 text-center">Only you</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setVisibility("public")}
                                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all ${visibility === "public"
                                    ? "border-amber-500/50 bg-amber-500/10 text-zinc-100"
                                    : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/50"
                                    }`}
                            >
                                <LuGlobe className={`h-6 w-6 ${visibility === "public" ? "text-amber-500" : "text-zinc-500"}`} />
                                <div>
                                    <span className="block text-sm font-medium text-center">Public</span>
                                    <span className="block text-xs opacity-80 mt-0.5 text-center">Discoverable</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Public-specific fields */}
                    {visibility === "public" && (
                        <div className="space-y-5 pt-4 border-t border-zinc-800">
                            <FormInput
                                id="description"
                                as="textarea"
                                label="Description"
                                required
                                error={errors.description}
                                onValueChange={(value) => {
                                    if (visibility === "public" && value.length > WORKFLOW_CONSTANTS.MAX_DESCRIPTION_LENGTH) return;
                                    setDescription(value);
                                    setErrors({ ...errors, description: undefined });
                                }}
                                helperText={!errors.description ? `${description.length} / ${WORKFLOW_CONSTANTS.MAX_DESCRIPTION_LENGTH}` : undefined}
                                textareaProps={{
                                    value: description,
                                    placeholder: "Describe what this workflow does...",
                                    rows: 3,
                                }}
                                className="resize-none bg-zinc-900/80 border-zinc-700 focus:border-amber-500/50 focus:ring-amber-500/20"
                            />

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 text-zinc-300">
                                    <LuTag className="h-3.5 w-3.5" />
                                    Tags
                                    <span className="text-zinc-500 font-normal text-xs">(from nodes)</span>
                                </Label>
                                {autoTags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                                        {autoTags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 border-dashed">
                                        <p className="text-sm text-zinc-500 text-center">
                                            Add nodes to generate tags automatically
                                        </p>
                                    </div>
                                )}
                                {errors.tags && (
                                    <p className="text-xs text-red-400">{errors.tags}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-900/30 border-t border-zinc-800">
                    <Button
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 "
                    >
                        <LuSave className="h-4 w-4 mr-1.5 inline" />
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}