import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/events", "routes/api.events.ts"),
  route("dashboard/app/:appName?", "routes/dashboard.app.tsx"),
  route("dashboard/tenant/:tenantName?", "routes/dashboard.tenant.tsx"),
] satisfies RouteConfig;
