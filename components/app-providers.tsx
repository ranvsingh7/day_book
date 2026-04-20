"use client";

import { Toaster } from "sonner";

import { ServiceWorkerRegister } from "@/components/service-worker-register";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
      <ServiceWorkerRegister />
    </>
  );
}
