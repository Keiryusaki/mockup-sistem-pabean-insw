import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { AppLayout } from "./components/AppLayout";
import { ComponentDocsPage } from "./pages/ComponentDocsPage";
import { ChangeLogPage } from "./pages/ChangeLogPage";
import { Dashboard } from "./pages/Dashboard";
import { DataPage } from "./pages/DataPage";
import { DetailPage } from "./pages/DetailPage";
import { FormPage } from "./pages/FormPage";
import { IconPage } from "./pages/IconPage";
import { ProgressPage } from "./pages/ProgressPage";
import { LoadingPage } from "./pages/LoadingPage";
import { FeedbackInboxPage } from "./pages/FeedbackInboxPage";
import { AppSelectorPage } from "./pages/AppSelectorPage";
import { SmartFormRolePage } from "./pages/SmartFormRolePage";
import { ClientAppLayout } from "./pages/client/ClientAppLayout";
import { ClientLoginPage } from "./pages/client/ClientLoginPage";
import { ClientRelationPage } from "./pages/client/ClientRelationPage";
import { ClientPengajuanPage } from "./pages/client/ClientPengajuanPage";
import { ClientTrackingPage } from "./pages/client/ClientTrackingPage";
import { PenyediaAppLayout } from "./pages/penyedia/PenyediaAppLayout";
import { PenyediaDashboardPage } from "./pages/penyedia/PenyediaDashboardPage";
import { PenyediaPengajuanPage } from "./pages/penyedia/PenyediaPengajuanPage";
import { PenyediaDetailPage } from "./pages/penyedia/PenyediaDetailPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: AppSelectorPage,
});

const smartFormRoleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/smart-form",
  component: SmartFormRolePage,
});

const clientLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/client/login",
  component: ClientLoginPage,
});

const clientRelationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/client/relasi",
  component: ClientRelationPage,
});

const clientAppRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/client",
  component: ClientAppLayout,
});

const clientPengajuanRoute = createRoute({
  getParentRoute: () => clientAppRoute,
  path: "/pengajuan",
  validateSearch: (search: Record<string, unknown>) => {
    const status = typeof search.status === "string" ? search.status : undefined;
    return {
      status:
        status === "Proses" ||
        status === "Selesai" ||
        status === "Ditolak"
          ? status
          : undefined,
    };
  },
  component: ClientPengajuanPage,
});

const clientTrackingRoute = createRoute({
  getParentRoute: () => clientAppRoute,
  path: "/tracking",
  validateSearch: (search: Record<string, unknown>) => ({
    pengajuan: typeof search.pengajuan === "string" ? search.pengajuan : undefined,
  }),
  component: ClientTrackingPage,
});

const smartFormRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "smart-form-app",
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => smartFormRoute,
  path: "/dashboard",
  component: Dashboard,
});
const dataRoute = createRoute({
  getParentRoute: () => smartFormRoute,
  path: "/data",
  validateSearch: (search: Record<string, unknown>) => {
    const status = typeof search.status === "string" ? search.status : undefined;
    return {
      status:
        status === "Draft" ||
        status === "Proses" ||
        status === "Selesai" ||
        status === "Disetujui" ||
        status === "Ditolak"
          ? status
          : undefined,
    };
  },
  component: DataPage,
});
const detailRoute = createRoute({
  getParentRoute: () => smartFormRoute,
  path: "/detail",
  validateSearch: (search: Record<string, unknown>) => ({
    pengajuan: typeof search.pengajuan === "string" ? search.pengajuan : undefined,
  }),
  component: DetailPage,
});
const formRoute = createRoute({ getParentRoute: () => smartFormRoute, path: "/form", component: FormPage });
const progressRoute = createRoute({
  getParentRoute: () => smartFormRoute,
  path: "/progress",
  validateSearch: (search: Record<string, unknown>) => ({
    pengajuan: typeof search.pengajuan === "string" ? search.pengajuan : undefined,
  }),
  component: ProgressPage,
});
const loadingRoute = createRoute({ getParentRoute: () => smartFormRoute, path: "/loading", component: LoadingPage });
const feedbackRoute = createRoute({ getParentRoute: () => smartFormRoute, path: "/feedback", component: FeedbackInboxPage });
const componentRoute = createRoute({ getParentRoute: () => smartFormRoute, path: "/component", component: ComponentDocsPage });
const iconRoute = createRoute({ getParentRoute: () => smartFormRoute, path: "/icon", component: IconPage });
const changelogRoute = createRoute({ getParentRoute: () => smartFormRoute, path: "/changelog", component: ChangeLogPage });

const penyediaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/penyedia",
  component: PenyediaAppLayout,
});

const penyediaIndexRoute = createRoute({
  getParentRoute: () => penyediaRoute,
  path: "/",
  component: PenyediaDashboardPage,
});

const penyediaPengajuanRoute = createRoute({
  getParentRoute: () => penyediaRoute,
  path: "/pengajuan",
  validateSearch: (search: Record<string, unknown>) => {
    const kind = typeof search.kind === "string" ? search.kind : undefined;
    return {
      kind: kind === "Ekspor" || kind === "Impor" || kind === "KEK" ? kind : undefined,
      country: typeof search.country === "string" ? search.country : undefined,
      q: typeof search.q === "string" ? search.q : undefined,
    };
  },
  component: PenyediaPengajuanPage,
});

const penyediaDetailRoute = createRoute({
  getParentRoute: () => penyediaRoute,
  path: "/detail",
  validateSearch: (search: Record<string, unknown>) => ({
    pengajuan: typeof search.pengajuan === "string" ? search.pengajuan : undefined,
  }),
  component: PenyediaDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  smartFormRoleRoute,
  clientLoginRoute,
  clientRelationRoute,
  clientAppRoute.addChildren([clientPengajuanRoute, clientTrackingRoute]),
  penyediaRoute.addChildren([penyediaIndexRoute, penyediaPengajuanRoute, penyediaDetailRoute]),
  smartFormRoute.addChildren([
    dashboardRoute,
    dataRoute,
    detailRoute,
    formRoute,
    progressRoute,
    loadingRoute,
    feedbackRoute,
    componentRoute,
    iconRoute,
    changelogRoute,
  ]),
]);

const basepath = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");

export const router = createRouter({ routeTree, basepath });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
