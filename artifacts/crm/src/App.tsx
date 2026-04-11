import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/data-context";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Companies from "@/pages/companies/index";
import CompanyDetail from "@/pages/companies/detail";
import Contacts from "@/pages/contacts/index";
import ContactDetail from "@/pages/contacts/detail";
import Pipelines from "@/pages/pipelines/index";
import PipelineDetail from "@/pages/pipelines/detail";
import Deals from "@/pages/deals/index";
import DealDetail from "@/pages/deals/detail";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/companies" component={Companies} />
        <Route path="/companies/:id" component={CompanyDetail} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/contacts/:id" component={ContactDetail} />
        <Route path="/pipelines" component={Pipelines} />
        <Route path="/pipelines/:id" component={PipelineDetail} />
        <Route path="/deals" component={Deals} />
        <Route path="/deals/:id" component={DealDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
