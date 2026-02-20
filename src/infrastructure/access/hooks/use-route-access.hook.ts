import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiError } from "@/src/infrastructure/api";
import { HTTP_STATUS } from "@/src/infrastructure/api/constants";
import { useAlert } from "@/src/infrastructure/messages/alert.service";

import { AccessService } from "../access.service";

const PUBLIC_ROUTES = new Set<string>(["/", "/main/contact", "/capabilities", "/downloads"]);

/** Mensajes ante los cuales no se muestra toast ni alert (solo redirección si aplica). */
const SILENT_ACCESS_MESSAGES = new Set([
  "No tienes permisos suficientes para acceder a este recurso",
  "Token de autenticación no disponible",
]);

interface UseRouteAccessOptions {
  redirectTo?: string;
  autoRedirect?: boolean;
}

interface UseRouteAccessResult {
  loading: boolean;
  allowed: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  handleApiError: (error: unknown) => boolean;
  isScreenFocused: boolean;
}

export function useRouteAccessGuard(
  route: string,
  options?: UseRouteAccessOptions,
): UseRouteAccessResult {
  const router = useRouter();
  const alert = useAlert();
  const isFocused = useIsFocused();

  const redirectTo = options?.redirectTo ?? "/";
  const autoRedirect = options?.autoRedirect ?? true;

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  const hasHandledRef = useRef(false);

  const alertRef = useRef(alert);
  const routerRef = useRef(router);

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const handleDenied = useCallback(
    (serverMessage?: string) => {
      if (hasHandledRef.current) {
        return;
      }

      hasHandledRef.current = true;
      const trimmed = serverMessage?.trim();
      const isSilentMessage = trimmed
        ? SILENT_ACCESS_MESSAGES.has(trimmed)
        : false;
      if (!isSilentMessage) {
        alertRef.current.showError(trimmed ? trimmed : "errors.forbidden");
      }

      if (autoRedirect) {
        routerRef.current.replace(redirectTo as any);
      }
    },
    [autoRedirect, redirectTo],
  );

  const evaluateResponse = useCallback(
    (isAllowed: boolean, serverMessage?: string) => {
      setAllowed(isAllowed);

      if (isAllowed) {
        hasHandledRef.current = false;
        setError(null);
      } else {
        handleDenied(serverMessage);
      }
    },
    [handleDenied],
  );

  const checkAccess = useCallback(
    async (targetRoute: string) => {
      if (!targetRoute) {
        setAllowed(true);
        setLoading(false);
        setInitialized(true);
        return;
      }

      const normalizedRoute = targetRoute.replace(/\/+$/, "") || "/";
      if (PUBLIC_ROUTES.has(normalizedRoute)) {
        setAllowed(true);
        setLoading(false);
        setInitialized(true);
        return;
      }

      setLoading(true);

      try {
        const { allowed: isAllowed, message: serverMessage } =
          await AccessService.checkRouteAccess(normalizedRoute);
        evaluateResponse(isAllowed, serverMessage);
      } catch (err: unknown) {
        const apiError = err instanceof ApiError ? err : null;

        if (apiError) {
          if (apiError.statusCode === HTTP_STATUS.FORBIDDEN) {
            evaluateResponse(false, apiError.message);
          } else if (apiError.statusCode === HTTP_STATUS.UNAUTHORIZED) {
            hasHandledRef.current = true;
            routerRef.current.replace(redirectTo as any);
          } else {
            setAllowed(false);
            setError(err instanceof Error ? err : new Error("Unknown error"));
            alertRef.current.showError("errors.generic");
          }
        } else {
          setAllowed(false);
          setError(err instanceof Error ? err : new Error("Unknown error"));
          alertRef.current.showError("errors.generic");
        }
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    },
    [evaluateResponse, redirectTo],
  );

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    setInitialized(false);
  }, [route, isFocused]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    if (!initialized) {
      hasHandledRef.current = false;
      checkAccess(route);
    }
  }, [checkAccess, initialized, route, isFocused]);

  const handleApiError = useCallback(
    (err: unknown) => {
      const apiError = err instanceof ApiError ? err : null;

      if (apiError) {
        if (apiError.statusCode === HTTP_STATUS.FORBIDDEN) {
          evaluateResponse(false, apiError.message);
          setInitialized(true);
          return true;
        }

        if (apiError.statusCode === HTTP_STATUS.UNAUTHORIZED) {
          hasHandledRef.current = true;
          routerRef.current.replace(redirectTo as any);
          setInitialized(true);
          return true;
        }
      }

      return false;
    },
    [evaluateResponse, redirectTo],
  );

  const refresh = useCallback(async () => {
    setInitialized(false);
    await checkAccess(route);
  }, [checkAccess, route]);

  return useMemo(
    () => ({
      loading,
      allowed,
      error,
      refresh,
      handleApiError,
      isScreenFocused: isFocused,
    }),
    [allowed, error, handleApiError, isFocused, loading, refresh],
  );
}
