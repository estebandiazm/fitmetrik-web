"use client";
import { createContext, ReactNode, useEffect, useState } from "react";
import { Client } from "../domain/types/Client";
import { ClientContextType } from "./ClientContextType";

export const ClientContext = createContext<ClientContextType | null>(null);

interface ClientContextProps {
  children?: ReactNode;
}

const ClientProvider: React.FC<ClientContextProps> = ({ children }) => {

  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    let next: Client = { name: "", plans: [], coachId: "" };
    try {
      const stored = localStorage.getItem("client");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old data shape (plan → plans)
        if (parsed.plan && !parsed.plans) {
          parsed.plans = [parsed.plan];
          delete parsed.plan;
        }
        next = parsed;
      }
    } catch (err) {
      console.warn("Error leyendo localStorage", err);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only hydration from localStorage; SSR renders null so the first client render still matches before this runs
    setClient(next);
  }, []);

  useEffect(() => {
    if (client) {
      localStorage.setItem("client", JSON.stringify(client));
    }
  }, [client]);

  const saveClient = (clientToSave: Client) => {
    setClient({ ...clientToSave });
    localStorage.setItem("client", JSON.stringify(clientToSave));
  };

  if (!client) return null;

  return (
    <ClientContext.Provider value={{ client, saveClient }}>
      {children}
    </ClientContext.Provider>
  );
};

export default ClientProvider;
