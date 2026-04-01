"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  ADMIN_PRODE_STORAGE_KEY,
  ADMIN_PRODE_UPDATED_EVENT,
} from "@/state/admin-prode-storage";
import {
  INGESTION_STORAGE_KEY,
  INGESTION_UPDATED_EVENT,
} from "@/state/ingestion-storage";

const CatalogueRevisionContext = createContext(0);

/**
 * Invalida vistas que dependen de catálogo + resultados (mock + admin + ingesta).
 * Incluye `storage` entre pestañas para que el ranking se actualice al cargar resultados.
 */
export function CatalogueRefreshProvider({ children }: { children: ReactNode }) {
  const [rev, setRev] = useState(0);
  useEffect(() => {
    const bump = () => setRev((r) => r + 1);
    window.addEventListener(ADMIN_PRODE_UPDATED_EVENT, bump);
    window.addEventListener(INGESTION_UPDATED_EVENT, bump);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === ADMIN_PRODE_STORAGE_KEY ||
        e.key === INGESTION_STORAGE_KEY
      ) {
        bump();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ADMIN_PRODE_UPDATED_EVENT, bump);
      window.removeEventListener(INGESTION_UPDATED_EVENT, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return (
    <CatalogueRevisionContext.Provider value={rev}>
      {children}
    </CatalogueRevisionContext.Provider>
  );
}

export function useCatalogueRevision(): number {
  return useContext(CatalogueRevisionContext);
}
