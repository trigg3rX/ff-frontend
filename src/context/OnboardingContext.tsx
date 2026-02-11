"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { useCreateSafeWallet } from "@/web3/hooks/useCreateSafeWallet";
import { API_CONFIG } from "@/config/api";
import { ChainInfo, getChain } from "@/web3/config/chain-registry";

import {
    validateAndGetOnboardingChains,
    ensureChainSelected,
    waitForChain,
    verifyModuleEnabled,
} from "@/web3/onboard-utils";

export type OnboardingStepStatus = "idle" | "pending" | "success" | "error";

// Progress for a single chain
export interface ChainProgress {
    walletCreate: OnboardingStepStatus;
    moduleSign: OnboardingStepStatus;
    moduleEnable: OnboardingStepStatus;
    moduleVerify: OnboardingStepStatus;
    error?: string;
    safeAddress?: string;
}

export type ChainConfig = ChainInfo;

export interface UserData {
    id: string;
    address: string;
    email: string;
    onboarded_at: string;
    safe_wallet_address_testnet?: string;
    safe_wallet_address_mainnet?: string;
}

export interface OnboardingContextType {
    // State
    needsOnboarding: boolean;
    isOnboarding: boolean;
    isCheckingUser: boolean;
    isModeValid: boolean | null;
    chainsToSetup: ChainConfig[];
    progress: Record<string, ChainProgress>;
    currentSigningChain: string | null;
    /** True when the wallet-choice step is resolved (user chose, or returning user auto-skipped) */
    walletChoiceCompleted: boolean;
    /** Same as walletChoiceCompleted — kept for backward compat */
    walletChoiceCompletedByUser: boolean;
    /** True once the initial "does user already exist?" check has finished */
    initialCheckDone: boolean;

    // Actions
    setWalletChoiceCompleted: (value: boolean) => void;
    startOnboarding: () => Promise<void>;
    retryChain: (identifier: string | number) => Promise<void>;
    dismissOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
    undefined
);

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within OnboardingProvider");
    }
    return context;
};

// Initialize progress for chains
const initializeProgress = (chains: ChainConfig[]): Record<string, ChainProgress> => {
    const progress: Record<string, ChainProgress> = {};
    for (const chain of chains) {
        progress[chain.id] = {
            walletCreate: "idle",
            moduleSign: "idle",
            moduleEnable: "idle",
            moduleVerify: "idle",
        };
    }
    return progress;
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { authenticated, ready } = usePrivy();
    const { walletAddress, ethereumProvider, wallet: embeddedWallet } = usePrivyWallet();
    const { getPrivyAccessToken } = usePrivyWallet();
    const { signEnableModule, submitEnableModule, createSafeWallet } = useCreateSafeWallet();

    // Mode validation state
    const [isModeValid, setIsModeValid] = useState<boolean | null>(null);
    const [chainsToSetup, setChainsToSetup] = useState<ChainConfig[]>([]);

    const [isCheckingUser, setIsCheckingUser] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [progress, setProgress] = useState<Record<string, ChainProgress>>({});
    const [currentSigningChain, setCurrentSigningChain] = useState<string | null>(null);

    // Wallet choice: false until the user explicitly acts OR the early check auto-completes it
    const [walletChoiceCompleted, setWalletChoiceCompletedState] = useState(false);
    // True once the early "does user exist?" check has finished
    const [initialCheckDone, setInitialCheckDone] = useState(false);

    const prevAuthRef = useRef(false);

    const setWalletChoiceCompleted = useCallback((value: boolean) => {
        setWalletChoiceCompletedState(value);
    }, []);

    // Fetch user data by authenticated user ID (safer than by address)
    const fetchUserData = useCallback(async (): Promise<UserData | null> => {
        if (!authenticated) return null;

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return null;

            const response = await fetch(
                `${API_CONFIG.BASE_URL}/users/me`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.success ? data.data : null;
        } catch {
            //Failed to fetch user data
            return null;
        }
    }, [authenticated, getPrivyAccessToken]);

    // ── Early user-existence check ──────────────────────────────────────
    // Runs as soon as the user authenticates.  If the backend already knows
    // this user (returning user), we auto-complete the wallet-choice step
    // so the "Connect Wallet?" modal never flashes for them.
    // For new users the backend returns 401 → fetchUserData returns null →
    // walletChoiceCompleted stays false and the modal shows.
    useEffect(() => {
        const justLoggedOut = !authenticated && prevAuthRef.current;
        prevAuthRef.current = authenticated;

        if (justLoggedOut || !authenticated) {
            // Reset everything on logout / before auth
            setWalletChoiceCompletedState(false);
            setInitialCheckDone(false);
            setNeedsOnboarding(false);
            setIsOnboarding(false);
            return;
        }

        if (!ready) return;

        let cancelled = false;

        (async () => {
            try {
                const user = await fetchUserData();
                if (cancelled) return;

                if (user) {
                    // Returning user with a backend record → skip modal
                    setWalletChoiceCompletedState(true);
                }
                // null → new user, walletChoiceCompleted stays false
            } catch {
                // Ignore – modal will show and user can proceed
            } finally {
                if (!cancelled) setInitialCheckDone(true);
            }
        })();

        return () => { cancelled = true; };
    }, [ready, authenticated, fetchUserData]);

    // Validate mode on mount
    useEffect(() => {
        const validateMode = async () => {
            try {
                const { chains } = await validateAndGetOnboardingChains();
                setIsModeValid(true);
                setChainsToSetup(chains);
                setProgress(initializeProgress(chains));
            } catch {
                setIsModeValid(false);
                setChainsToSetup([]);
            }
        };

        validateMode();
    }, []);

    // Process a single chain: create wallet + switch chain + sign + enable + verify module
    const processChain = useCallback(
        async (chain: ChainConfig): Promise<boolean> => {
            const chainKey = chain.id;
            const numericChainId = chain.chainId;

            try {
                // Step 1: Create wallet
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], walletCreate: "pending", error: undefined },
                }));

                // Use the updated createSafeWallet hook with targetChainId
                const createResult = await createSafeWallet(walletAddress || "", numericChainId);

                if (!createResult.success) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], walletCreate: "error", error: createResult.error },
                    }));
                    return false;
                }

                const safeAddress = createResult.safeAddress!;
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], walletCreate: "success", safeAddress },
                }));

                // Step 2: Switch to target chain before signing
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleSign: "pending" },
                }));
                setCurrentSigningChain(String(chainKey));

                try {
                    await ensureChainSelected(embeddedWallet || null, numericChainId);
                    // Wait for chain to be active
                    await waitForChain(() => numericChainId, numericChainId, 10000);
                } catch (switchError) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: {
                            ...prev[chainKey],
                            moduleSign: "error",
                            error: `Failed to switch to ${chain.name}: ${switchError instanceof Error ? switchError.message : String(switchError)}`,
                        },
                    }));
                    setCurrentSigningChain(null);
                    return false;
                }

                // Step 3: Sign enable module transaction (now on correct chain)
                const signResult = await signEnableModule(safeAddress, numericChainId);

                if (!signResult.success) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], moduleSign: "error", error: signResult.error },
                    }));
                    setCurrentSigningChain(null);
                    return false;
                }

                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleSign: "success" },
                }));
                setCurrentSigningChain(null);

                // Check if module was already enabled (signResult.data.safeTxHash will be empty)
                if (signResult.data && !signResult.data.safeTxHash) {
                    // Module already enabled
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], moduleEnable: "success", moduleVerify: "success" },
                    }));
                    return true;
                }

                // Step 4: Submit enable module transaction
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleEnable: "pending" },
                }));

                const submitResult = await submitEnableModule();

                if (!submitResult.success) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], moduleEnable: "error", error: submitResult.error },
                    }));
                    return false;
                }

                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleEnable: "success" },
                }));

                // Step 5: Verify module is enabled on-chain
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleVerify: "pending" },
                }));

                try {
                    if (!ethereumProvider) {
                        throw new Error("Ethereum provider not available");
                    }

                    const isEnabled = await verifyModuleEnabled(
                        safeAddress,
                        numericChainId,
                        ethereumProvider,
                        5, // maxRetries
                        2000 // delayMs
                    );

                    if (!isEnabled) {
                        setProgress((prev) => ({
                            ...prev,
                            [chainKey]: {
                                ...prev[chainKey],
                                moduleVerify: "error",
                                error: "Module not enabled after transaction",
                            },
                        }));
                        return false;
                    }

                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], moduleVerify: "success" },
                    }));

                    return true;
                } catch (verifyError) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: {
                            ...prev[chainKey],
                            moduleVerify: "error",
                            error: `Verification failed: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`,
                        },
                    }));
                    return false;
                }
            } catch (error) {
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: {
                        ...prev[chainKey],
                        error: error instanceof Error ? error.message : "Unknown error",
                    },
                }));
                return false;
            }
        },
        [
            createSafeWallet,
            signEnableModule,
            submitEnableModule,
            embeddedWallet,
            ethereumProvider,
            walletAddress,
        ]
    );

    // Check if user needs onboarding only after the wallet-choice step is done.
    // This avoids 401 from /users/me when the user has no linked wallet yet.
    useEffect(() => {
        if (
            !ready ||
            !authenticated ||
            !walletAddress ||
            isModeValid !== true ||
            !walletChoiceCompleted
        ) {
            setNeedsOnboarding(false);
            return;
        }

        const checkUser = async () => {
            setIsCheckingUser(true);
            try {
                const user = await fetchUserData();

                // New user (backend returned 401 / no record) → needs full onboarding
                if (user === null) {
                    setNeedsOnboarding(true);
                    return;
                }

                // Existing user – check which chains still need setup
                const chainsNeedingSetup = chainsToSetup.filter((chain) => {
                    const c = getChain(chain.chainId);
                    if (c?.isTestnet) {
                        return !user?.safe_wallet_address_testnet;
                    }
                    if (c && !c.isTestnet) {
                        return !user?.safe_wallet_address_mainnet;
                    }
                    return true;
                });

                if (chainsNeedingSetup.length > 0) {
                    setNeedsOnboarding(true);
                    // Pre-fill progress for existing wallets
                    setProgress((prev) => {
                        const updated = { ...prev };
                        for (const chain of chainsToSetup) {
                            let hasWallet = false;
                            const c = getChain(chain.chainId);
                            if (c?.isTestnet) {
                                hasWallet = !!user?.safe_wallet_address_testnet;
                            } else if (c && !c.isTestnet) {
                                hasWallet = !!user?.safe_wallet_address_mainnet;
                            }

                            if (hasWallet) {
                                updated[chain.id] = {
                                    walletCreate: "success",
                                    moduleSign: "success",
                                    moduleEnable: "success",
                                    moduleVerify: "success",
                                };
                            }
                        }
                        return updated;
                    });
                } else {
                    setNeedsOnboarding(false);
                }
            } catch {
                // Show onboarding on error
                setNeedsOnboarding(true);
            } finally {
                setIsCheckingUser(false);
            }
        };

        checkUser();
    }, [
        ready,
        authenticated,
        walletAddress,
        fetchUserData,
        chainsToSetup,
        isModeValid,
        walletChoiceCompleted,
    ]);

    // Start the onboarding process (one run per click; use Retry on a chain to retry that chain only)
    const startOnboarding = useCallback(async () => {
        if (isOnboarding) return;
        setIsOnboarding(true);

        let allSuccessful = true;

        // Process each chain that needs setup
        for (const chain of chainsToSetup) {
            const chainProgress = progress[chain.id];

            // Skip if already complete (all steps success)
            if (
                chainProgress?.walletCreate === "success" &&
                chainProgress?.moduleSign === "success" &&
                chainProgress?.moduleEnable === "success" &&
                chainProgress?.moduleVerify === "success"
            ) {
                continue;
            }

            const success = await processChain(chain);
            if (!success) {
                allSuccessful = false;
                // Don't break - continue with other chains
            }
        }

        // Refresh user data
        await fetchUserData();

        // Check if all chains are complete
        if (allSuccessful) {
            setNeedsOnboarding(false);
        }

        setIsOnboarding(false);
    }, [isOnboarding, chainsToSetup, progress, processChain, fetchUserData]);

    const retryChain = useCallback(
        async (identifier: string | number) => {
            const chain = chainsToSetup.find((c) => c.id === identifier || c.chainId === identifier);
            if (!chain) return;

            const success = await processChain(chain);

            if (success) {
                // Refresh user data
                await fetchUserData();

                // Check if all chains are now complete
                const allComplete = chainsToSetup.every((c) => {
                    const identifierMatch = c.id === identifier || c.chainId === identifier;
                    if (identifierMatch) return true;
                    // For other chains, check progress by mapping their string ID from the chain object
                    const p = progress[c.id];
                    return p?.moduleVerify === "success";
                });

                if (allComplete) {
                    setNeedsOnboarding(false);
                    setIsOnboarding(false);
                }
            }
        },
        [chainsToSetup, processChain, progress, fetchUserData]
    );

    // Dismiss onboarding (user can resume later)
    const dismissOnboarding = useCallback(() => {
        setNeedsOnboarding(false);
        setIsOnboarding(false);
        // User will see onboarding again on next session if not complete
    }, []);

    const contextValue = useMemo<OnboardingContextType>(
        () => ({
            needsOnboarding,
            isOnboarding,
            isCheckingUser,
            isModeValid,
            chainsToSetup,
            progress,
            currentSigningChain,
            walletChoiceCompleted,
            walletChoiceCompletedByUser: walletChoiceCompleted,
            initialCheckDone,
            setWalletChoiceCompleted,
            startOnboarding,
            retryChain,
            dismissOnboarding,
        }),
        [
            needsOnboarding,
            isOnboarding,
            isCheckingUser,
            isModeValid,
            chainsToSetup,
            progress,
            currentSigningChain,
            walletChoiceCompleted,
            initialCheckDone,
            setWalletChoiceCompleted,
            startOnboarding,
            retryChain,
            dismissOnboarding,
        ]
    );

    return (
        <OnboardingContext.Provider value={contextValue}>
            {children}
        </OnboardingContext.Provider>
    );
};
