"use client";

import { useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { SUPPORTED_VIEM_CHAINS } from "@/web3/config/chain-registry";
import { SafeWalletProvider } from "@/context/SafeWalletContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ToastProvider } from "@/context/ToastContext";
import { OnboardingSetupModal } from "@/components/onboard/OnboardingSetupModal";
import { WalletChoiceModal } from "@/components/onboard/WalletChoiceModal";
import { LenisProvider } from "./LenisProvider";

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

    // Get Privy App ID from environment variable
    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

    // Get chain configuration from centralized module
    const supportedChains = SUPPORTED_VIEM_CHAINS;
    const defaultChain = SUPPORTED_VIEM_CHAINS.find(c => c.id === 421614);

    return (
        <ToastProvider>
            <LenisProvider>
                <PrivyProvider
                    appId={privyAppId}
                    config={{
                        loginMethods: ["email"],
                        embeddedWallets: {
                            ethereum: {
                                createOnLogin: "off",
                            },
                        },
                        appearance: {
                            theme: "dark",
                            accentColor: "#FF6500",
                            walletList: [
                                "metamask",
                                "wallet_connect_qr",
                                "wallet_connect",
                                "detected_ethereum_wallets",
                            ],
                        },
                        defaultChain: defaultChain,
                        supportedChains: supportedChains,
                    }}
                >
                    <QueryClientProvider client={queryClient}>
                        <OnboardingProvider>
                            <SafeWalletProvider>
                                {children}
                                <WalletChoiceModal />
                                <OnboardingSetupModal />
                            </SafeWalletProvider>
                        </OnboardingProvider>
                    </QueryClientProvider>
                </PrivyProvider>
            </LenisProvider>
        </ToastProvider>
    );
}