import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { DataPage } from "./pages/DataPage";
import { FormPage } from "./pages/FormPage";
import { LoadingPage } from "./pages/LoadingPage";

const rootRoute = createRootRoute({ component: AppLayout });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Dashboard });
const dataRoute = createRoute({ getParentRoute: () => rootRoute, path: "/data", component: DataPage });
const formRoute = createRoute({ getParentRoute: () => rootRoute, path: "/form", component: FormPage });
const loadingRoute = createRoute({ getParentRoute: () => rootRoute, path: "/loading", component: LoadingPage });

const routeTree = rootRoute.addChildren([indexRoute, dataRoute, formRoute, loadingRoute]);

const basepath = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");

export const router = createRouter({ routeTree, basepath });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
