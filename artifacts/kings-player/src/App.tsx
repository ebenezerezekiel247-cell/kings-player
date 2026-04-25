import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { queryClient } from "@/lib/queryClient";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import BrowsePage from "@/pages/browse";
import ListingPage from "@/pages/listing";
import CreateListingPage from "@/pages/create";
import DashboardPage from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL ?? `${typeof window !== "undefined" ? window.location.origin : ""}/api/__clerk`;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: "clerk" as const,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${typeof window !== "undefined" ? window.location.origin : ""}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(43, 96%, 56%)",
    colorForeground: "hsl(45, 20%, 92%)",
    colorMutedForeground: "hsl(220, 8%, 55%)",
    colorDanger: "hsl(0, 72%, 51%)",
    colorBackground: "hsl(220, 12%, 11%)",
    colorInput: "hsl(220, 10%, 20%)",
    colorInputForeground: "hsl(45, 20%, 92%)",
    colorNeutral: "hsl(220, 10%, 30%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden bg-[hsl(220,12%,11%)] border border-[hsl(220,10%,20%)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[hsl(45,20%,92%)]",
    headerSubtitle: "text-[hsl(220,8%,55%)]",
    socialButtonsBlockButtonText: "text-[hsl(45,20%,92%)]",
    formFieldLabel: "text-[hsl(45,20%,92%)]",
    footerActionLink: "text-[hsl(43,96%,56%)]",
    footerActionText: "text-[hsl(220,8%,55%)]",
    dividerText: "text-[hsl(220,8%,55%)]",
    identityPreviewEditButton: "text-[hsl(43,96%,56%)]",
    formFieldSuccessText: "text-[hsl(160,60%,45%)]",
    alertText: "text-[hsl(45,20%,92%)]",
    logoBox: "flex items-center justify-center py-2",
    logoImage: "h-8",
    socialButtonsBlockButton: "border border-[hsl(220,10%,20%)] bg-[hsl(220,12%,14%)] hover:bg-[hsl(220,12%,18%)]",
    formButtonPrimary: "bg-[hsl(43,96%,56%)] text-[hsl(220,15%,8%)] hover:bg-[hsl(43,96%,50%)]",
    formFieldInput: "bg-[hsl(220,10%,16%)] border-[hsl(220,10%,25%)] text-[hsl(45,20%,92%)]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[hsl(220,10%,20%)]",
    alert: "bg-[hsl(220,12%,14%)] border border-[hsl(220,10%,22%)]",
    otpCodeFieldInput: "bg-[hsl(220,10%,16%)] border-[hsl(220,10%,25%)] text-[hsl(45,20%,92%)]",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-10">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-10">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return <HomePage />;
}

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const uid = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== uid) {
        qc.clear();
      }
      prevRef.current = uid;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome Back", subtitle: "Sign in to Kings Player" } },
        signUp: { start: { title: "Join Kings Player", subtitle: "Create your account to start trading" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkCacheInvalidator />
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={HomeRedirect} />
                <Route path="/browse" component={BrowsePage} />
                <Route path="/listing/:id" component={ListingPage} />
                <Route path="/create" component={CreateListingPage} />
                <Route path="/dashboard" component={DashboardPage} />
                <Route path="/profile/:clerkId" component={ProfilePage} />
                <Route path="/sign-in/*?" component={SignInPage} />
                <Route path="/sign-up/*?" component={SignUpPage} />
                <Route component={NotFound} />
              </Switch>
            </main>
            <footer className="border-t border-border py-6 px-4 text-center text-sm text-muted-foreground">
              <p>Kings Player &copy; {new Date().getFullYear()} — The Premier Gaming Marketplace</p>
            </footer>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
