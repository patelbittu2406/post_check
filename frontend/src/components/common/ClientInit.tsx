"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";

export function ClientInit() {
  const { loadProfile } = useStore();

  useEffect(() => {
    loadProfile();
    // Enforce Canva light theme across entire app
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }, [loadProfile]);

  return null;
}
