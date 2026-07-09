import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import LandingPage from "@/pages/landing";
import TodayPage from "@/pages/today";
import WeekPage from "@/pages/week";
import EmployeesPage from "@/pages/employees";
import EmployeeDetailPage from "@/pages/employee-detail";
import SearchPage from "@/pages/search";
import NewMeetingPage from "@/pages/new";
import MeetingDetailPage from "@/pages/meeting";
import NotFoundPage from "@/pages/not-found";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

// REQUIRED — copy verbatim, do NOT change
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#e85d2f",
    colorForeground: "#1c1917",
    colorMutedForeground: "#78716c",
    colorDanger: "#ef4444",
    colorBackground: "#f7f3ef",
    colorInput: "#ffffff",
    colorInputForeground: "#1c1917",
    colorNeutral: "#d6cdc4",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#f7f3ef] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[#e8e0d8]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-[#1c1917] text-2xl font-bold",
    headerSubtitle: "text-[#78716c]",
    socialButtonsBlockButtonText: "text-[#1c1917] font-medium",
    formFieldLabel: "text-[#44403c] font-medium",
    footerActionLink: "text-[#e85d2f] font-medium hover:text-[#c4481e]",
    footerActionText: "text-[#78716c]",
    dividerText: "text-[#78716c]",
    identityPreviewEditButton: "text-[#e85d2f]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-[#1c1917]",
    logoBox: "justify-center",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border border-[#d6cdc4] bg-white hover:bg-[#faf8f5]",
    formButtonPrimary: "bg-[#e85d2f] hover:bg-[#c4481e] text-white font-semibold",
    formFieldInput: "border-[#d6cdc4] bg-white text-[#1c1917] focus:border-[#e85d2f] focus:ring-[#e85d2f]/20",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#d6cdc4]",
    alert: "border-[#d6cdc4]",
    otpCodeFieldInput: "border-[#d6cdc4]",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) qc.clear();
      prevUserIdRef.current = userId;
    });
    return unsub;
  }, [addListener, qc]);
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/today" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in"><Layout>{children}</Layout></Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Добро пожаловать", subtitle: "Войдите в Studio Sync" } },
        signUp: { start: { title: "Создать аккаунт", subtitle: "Присоединяйтесь к команде" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/today">{() => <ProtectedPage><TodayPage /></ProtectedPage>}</Route>
            <Route path="/week">{() => <ProtectedPage><WeekPage /></ProtectedPage>}</Route>
            <Route path="/employees">{() => <ProtectedPage><EmployeesPage /></ProtectedPage>}</Route>
            <Route path="/employees/:id">{() => <ProtectedPage><EmployeeDetailPage /></ProtectedPage>}</Route>
            <Route path="/search">{() => <ProtectedPage><SearchPage /></ProtectedPage>}</Route>
            <Route path="/new">{() => <ProtectedPage><NewMeetingPage /></ProtectedPage>}</Route>
            <Route path="/meetings/:id">{(params) => <ProtectedPage><MeetingDetailPage /></ProtectedPage>}</Route>
            <Route>{() => <ProtectedPage><NotFoundPage /></ProtectedPage>}</Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
