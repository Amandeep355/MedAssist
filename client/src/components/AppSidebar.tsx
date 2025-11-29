import { Activity, Users, History as HistoryIcon, Stethoscope } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { translations } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";

export function AppSidebar() {
  const { language } = useLanguage();
  const t = translations[language];
  const [location] = useLocation();

  const menuItems = [
    {
      title: t.newDiagnosis,
      icon: Activity,
      url: "/",
      testId: "link-diagnosis",
    },
    {
      title: t.patients,
      icon: Users,
      url: "/patients",
      testId: "link-patients",
    },
    {
      title: t.history,
      icon: HistoryIcon,
      url: "/history",
      testId: "link-history",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-6">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-8 w-8 text-primary" />
          <div>
            <h2 className="font-semibold text-lg">{t.appName}</h2>
            <p className="text-xs text-muted-foreground">{t.tagline}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
