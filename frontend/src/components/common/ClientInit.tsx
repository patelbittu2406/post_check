"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";

export function ClientInit() {
  const { loadProfile, setTheme } = useStore();

  useEffect(() => {
    loadProfile();
    // Load saved theme preference (default to light)
    try {
      const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "light";
      if (savedTheme === "dark") {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        setTheme("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        setTheme("light");
      }
    } catch (e) {
      document.documentElement.classList.add("light");
    }
  }, [loadProfile, setTheme]);

  return null;
}
