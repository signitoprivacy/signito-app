import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/ScrollToTop";

import LandingPage from "./pages/LandingPage";
import StatusPage from "./pages/StatusPage";
import CrackChallengePage from "./pages/CrackChallengePage";
import PortfolioPage from "./pages/PortfolioPage";
import HistoryPage from "./pages/HistoryPage";
import SafeVaultDetailPage from "./pages/SafeVaultDetailPage";
import StealthSendDetailPage from "./pages/StealthSendDetailPage";
import AirSignDetailPage from "./pages/AirSignDetailPage";
import LearnOtpChainPage from "./pages/LearnOtpChainPage";
import LearnZkProofsPage from "./pages/LearnZkProofsPage";
import LearnOfflineSigningPage from "./pages/LearnOfflineSigningPage";
import LearnPrivacyModelPage from "./pages/LearnPrivacyModelPage";
import LearnNonCustodialPage from "./pages/LearnNonCustodialPage";
import LearnRelayPage from "./pages/LearnRelayPage";
import LearnSTokenPage from "./pages/LearnSTokenPage";
import DevQuickStartPage from "./pages/DevQuickStartPage";
import DevApiReferencePage from "./pages/DevApiReferencePage";
import DevOpenApiPage from "./pages/DevOpenApiPage";
import ClaimPage from "./pages/ClaimPage";
import { BatchZkPage, PrivateSwapPage, PrivateDexPage } from "./pages/ComingSoonPage";
import BasePortfolioPage from "./pages/BasePortfolioPage";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/status" component={StatusPage} />
      <Route path="/crack" component={CrackChallengePage} />
      <Route path="/app" component={PortfolioPage} />
      <Route path="/app/history" component={HistoryPage} />
      <Route path="/app/batch-zk" component={BatchZkPage} />
      <Route path="/app/private-swap" component={PrivateSwapPage} />
      <Route path="/app/private-dex" component={PrivateDexPage} />
      <Route path="/features/safevault" component={SafeVaultDetailPage} />
      <Route path="/features/stealthsend" component={StealthSendDetailPage} />
      <Route path="/features/airsign" component={AirSignDetailPage} />
      <Route path="/learn/ots-protocol" component={LearnOtpChainPage} />
      <Route path="/learn/zk-proofs" component={LearnZkProofsPage} />
      <Route path="/learn/offline-signing" component={LearnOfflineSigningPage} />
      <Route path="/learn/privacy-model" component={LearnPrivacyModelPage} />
      <Route path="/learn/non-custodial" component={LearnNonCustodialPage} />
      <Route path="/learn/relay" component={LearnRelayPage} />
      <Route path="/learn/stoken" component={LearnSTokenPage} />
      <Route path="/developers/quick-start" component={DevQuickStartPage} />
      <Route path="/developers/api-reference" component={DevApiReferencePage} />
      <Route path="/developers/openapi" component={DevOpenApiPage} />
      <Route path="/claim/:nonce" component={ClaimPage} />
      <Route path="/app/base" component={BasePortfolioPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
