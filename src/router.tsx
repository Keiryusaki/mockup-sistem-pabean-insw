import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AppLayout } from "./components/AppLayout";
import { ComponentDocsPage } from "./pages/ComponentDocsPage";
import { ChangeLogPage } from "./pages/ChangeLogPage";
import { Dashboard } from "./pages/Dashboard";
import { DataPage } from "./pages/DataPage";
import { FormPage } from "./pages/FormPage";
import { IconPage } from "./pages/IconPage";
import { ProgressPage } from "./pages/ProgressPage";
import { LoadingPage } from "./pages/LoadingPage";

const rootRoute = createRootRoute({ component: AppLayout });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Dashboard });
const dataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/data",
  validateSearch: (search: Record<string, unknown>) => {
    const status = typeof search.status === "string" ? search.status : undefined;
    return {
      status:
        status === "Draft" || status === "Proses" || status === "Disetujui" || status === "Ditolak" ? status : undefined,
    };
  },
  component: DataPage,
});
const formRoute = createRoute({ getParentRoute: () => rootRoute, path: "/form", component: FormPage });
const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/progress",
  validateSearch: (search: Record<string, unknown>) => ({
    pengajuan: typeof search.pengajuan === "string" ? search.pengajuan : undefined,
  }),
  component: ProgressPage,
});
const loadingRoute = createRoute({ getParentRoute: () => rootRoute, path: "/loading", component: LoadingPage });
const componentRoute = createRoute({ getParentRoute: () => rootRoute, path: "/component", component: ComponentDocsPage });
const iconRoute = createRoute({ getParentRoute: () => rootRoute, path: "/icon", component: IconPage });
const changelogRoute = createRoute({ getParentRoute: () => rootRoute, path: "/changelog", component: ChangeLogPage });

const routeTree = rootRoute.addChildren([indexRoute, dataRoute, formRoute, progressRoute, loadingRoute, componentRoute, iconRoute, changelogRoute]);

const basepath = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");

export const router = createRouter({ routeTree, basepath });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
