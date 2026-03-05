export type DashboardPreset = "today" | "week" | "month" | "year" | "custom";

export type DashboardRange = {
  label: string;
  preset: DashboardPreset;
  from: Date;
  to: Date;
  fromInput: string;
  toInput: string;
};
