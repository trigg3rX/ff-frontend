"use client";

import { useState, useCallback } from "react";

export interface ApiNotification {
    type: "success" | "error" | "info";
    message: string;
}

// Basic Auth
export interface ApiAuthBasic {
    type: "basic";
    username?: string;
    password?: string;
}

// Bearer Token
export interface ApiAuthBearer {
    type: "bearer";
    token?: string;
}

// API Key
export interface ApiAuthApiKey {
    type: "apiKey";
    apiKeyHeader?: string;
    apiKeyValue?: string;
    apiKeyType?: "header" | "query";
}

// None
export interface ApiAuthNone {
    type: "none";
}

export type ApiAuth = ApiAuthBasic | ApiAuthBearer | ApiAuthApiKey | ApiAuthNone;

export interface ApiLoadingState {
    testing: boolean;
}

interface UseApiNodeProps {
    nodeData: Record<string, unknown>;
    onDataChange: (updates: Record<string, unknown>) => void;
}

export function useApiNode({
    nodeData,
    onDataChange,
}: UseApiNodeProps) {
    // State initialization
    const [url, setUrl] = useState((nodeData.url as string) || "");
    const [method, setMethod] = useState((nodeData.method as string) || "GET");
    const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
        (nodeData.headers as Array<{ key: string; value: string }>) || []
    );
    const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>(
        (nodeData.queryParams as Array<{ key: string; value: string }>) || []
    );
    const [body, setBody] = useState((nodeData.body as string) || "");
    const [auth, setAuth] = useState<ApiAuth>((nodeData.auth as ApiAuth) || { type: "none" });

    // Loading & Notifications
    const [loading] = useState<ApiLoadingState>({ testing: false });
    const [notification, setNotification] = useState<ApiNotification | null>(null);

    // Helpers to update state and nodeData
    const updateUrl = useCallback((value: string) => {
        setUrl(value);
        onDataChange({ url: value });
    }, [onDataChange]);

    const updateMethod = useCallback((value: string) => {
        setMethod(value);
        onDataChange({ method: value });
    }, [onDataChange]);

    const updateHeaders = useCallback((value: Array<{ key: string; value: string }>) => {
        setHeaders(value);
        onDataChange({ headers: value });
    }, [onDataChange]);

    const updateQueryParams = useCallback((value: Array<{ key: string; value: string }>) => {
        setQueryParams(value);
        onDataChange({ queryParams: value });
    }, [onDataChange]);

    const updateBody = useCallback((value: string) => {
        setBody(value);
        onDataChange({ body: value });
    }, [onDataChange]);

    const updateAuth = useCallback((value: ApiAuth) => {
        setAuth(value);
        onDataChange({ auth: value });
    }, [onDataChange]);

    const clearNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return {
        url,
        method,
        headers,
        queryParams,
        body,
        auth,
        loading,
        notification,
        actions: {
            updateUrl,
            updateMethod,
            updateHeaders,
            updateQueryParams,
            updateBody,
            updateAuth,
            setNotification,
            clearNotification
        }
    };
}
