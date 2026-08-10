import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const MANIFEST_ID = "montezuma-admin-manifest";
const MANIFEST_HREF = "/manifest.webmanifest";

const AdminPwaContext = createContext({
  enabled: false,
  canInstall: false,
  installed: false,
  iosHint: false,
  promptInstall: async () => false,
});

function isAdminUser(user) {
  return Boolean(user?.id) && user.tipo !== "cliente";
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function ensureManifestLink() {
  let link = document.getElementById(MANIFEST_ID);
  if (!link) {
    link = document.createElement("link");
    link.id = MANIFEST_ID;
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  link.href = MANIFEST_HREF;
}

function removeManifestLink() {
  document.getElementById(MANIFEST_ID)?.remove();
}

async function registerAdminSw() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.error("[PWA] service worker:", err);
    return null;
  }
}

async function unregisterAdminSw() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
  } catch (err) {
    console.error("[PWA] unregister:", err);
  }
}

export function AdminPwaProvider({ children }) {
  const { user } = useAuth();
  const enabled = isAdminUser(user);
  const deferredPromptRef = useRef(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(() => isStandaloneDisplay());
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (!enabled) {
      removeManifestLink();
      deferredPromptRef.current = null;
      setCanInstall(false);
      setIosHint(false);
      unregisterAdminSw();
      return undefined;
    }

    ensureManifestLink();
    registerAdminSw();

    if (isStandaloneDisplay()) {
      setInstalled(true);
      return undefined;
    }

    const onBeforeInstall = (event) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setCanInstall(true);
      setIosHint(false);
    };

    const onInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
      setInstalled(true);
      setIosHint(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIos() && !isStandaloneDisplay()) {
      setIosHint(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [enabled]);

  const promptInstall = async () => {
    const deferred = deferredPromptRef.current;
    if (!deferred) return false;
    deferred.prompt();
    const choice = await deferred.userChoice;
    deferredPromptRef.current = null;
    setCanInstall(false);
    return choice?.outcome === "accepted";
  };

  return (
    <AdminPwaContext.Provider
      value={{ enabled, canInstall, installed, iosHint, promptInstall }}
    >
      {children}
    </AdminPwaContext.Provider>
  );
}

export function useAdminPwa() {
  return useContext(AdminPwaContext);
}
