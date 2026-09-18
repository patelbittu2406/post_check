"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";

export function ClientInit() {
  const { loadProfile } = useStore();

  useEffect(() => {
    loadProfile();
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [loadProfile]);

  return null;
}
