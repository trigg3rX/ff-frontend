"use client";

import React, { Component, ReactNode } from "react";
import { BiError, BiRefresh } from "react-icons/bi";
import { Button } from "@/components/ui/Button";


interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary - Catches React errors in child components
 *
 * Provides graceful error handling and recovery UI
 */
export class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to error tracking service (e.g., Sentry)
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.handleReset);
            }

            // Default error UI
            return (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background"
                    role="alertdialog"
                    aria-modal="true"
                >
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-background backdrop-blur-md"
                        aria-hidden="true"
                    />

                    {/* Modal Content */}
                    <div className="relative z-50 w-full max-w-[425px] flex flex-col items-center justify-center p-6 gap-4 bg-black/95 border-white/20 border rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <BiError className="w-8 h-8 text-orange-500" />
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-semibold text-center text-foreground">
                                Something went wrong
                            </h2>
                            <p className="text-base text-center text-muted-foreground max-w-[90%] mx-auto">
                                {this.state.error.message || "An unexpected error occurred."}
                            </p>
                        </div>

                        <div className="flex gap-3 w-full justify-center pt-2">
                            <Button
                                onClick={() => window.location.href = "/"}
                                className="flex-1 min-w-[100px]"
                            >
                                Go Home
                            </Button>
                            <Button
                                onClick={this.handleReset}
                                className="flex-1 min-w-[100px]"
                            >
                                <BiRefresh className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                        </div>

                        {process.env.NODE_ENV === "development" && (
                            <div className="w-full pt-4 mt-2 border-t border-white/5">
                                <details className="w-full group">
                                    <summary className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer list-none flex items-center justify-center gap-2 select-none">
                                        <span>View Error Details</span>
                                        <span className="text-[10px] uppercase tracking-wider opacity-50">(Dev Only)</span>
                                    </summary>
                                    <pre className="mt-4 p-4 text-[10px] leading-4 text-left font-mono bg-black/50 border border-white/5 rounded-lg overflow-auto max-h-60 text-red-200/80 shadow-inner scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
