import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { translations } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <Badge
      variant={isOnline ? "default" : "destructive"}
      className="gap-1"
      data-testid="badge-connection-status"
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          {t.online}
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          {t.offline}
        </>
      )}
    </Badge>
  );
}
