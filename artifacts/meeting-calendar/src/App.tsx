import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Week from "@/pages/week";
import Employees from "@/pages/employees";
import Search from "@/pages/search";
import NewMeeting from "@/pages/new";
import MeetingDetail from "@/pages/meeting";
import NotFound from '@/pages/not-found';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/week" component={Week} />
        <Route path="/employees" component={Employees} />
        <Route path="/search" component={Search} />
        <Route path="/new" component={NewMeeting} />
        <Route path="/meetings/:id" component={MeetingDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;