import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { AppConfigStatus } from "../types";

export const useConfigStatus = () => {
  const [config, setConfig] = useState<AppConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    void api
      .getConfigStatus()
      .then((status) => {
        if (alive) {
          setConfig(status);
          setConfigError(null);
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setConfig(null);
          setConfigError(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { config, loading, configError, setConfig };
};
