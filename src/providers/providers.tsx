"use client";

import { useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SafeWalletProvider } from "@/context/SafeWalletContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ToastProvider } from "@/context/ToastContext";
import { OnboardingSetupModal } from "@/components/onboard/OnboardingSetupModal";
import { WalletChoiceModal } from "@/components/onboard/WalletChoiceModal";
import { LenisProvider } from "./LenisProvider";
import PrivyAuthProvider from "./PrivyProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    // Create QueryClient inside the component to prevent re-initialization
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        retry: false,
                    },
                },
            })
    );

    return (
        <ToastProvider>
            <LenisProvider>
                <PrivyAuthProvider>
                    <QueryClientProvider client={queryClient}>
                        <OnboardingProvider>
                            <SafeWalletProvider>
                                {children}
                                <WalletChoiceModal />
                                <OnboardingSetupModal />
                            </SafeWalletProvider>
                        </OnboardingProvider>
                    </QueryClientProvider>
                </PrivyAuthProvider>
            </LenisProvider>
        </ToastProvider>
    );
}