export type ReportDensity = "detailed" | "concise";

export interface RenderVariant {
  key: string;
  theme: "mystic-dark" | "gentle-light";
  density: ReportDensity;
  label: string;
}

export const REPORT_VARIANTS: RenderVariant[] = [
  {
    key: "detailed-dark",
    theme: "mystic-dark",
    density: "detailed",
    label: "详细版 / 玄奥玄色"
  },
  {
    key: "detailed-light",
    theme: "gentle-light",
    density: "detailed",
    label: "详细版 / 明亮护眼"
  },
  {
    key: "concise-dark",
    theme: "mystic-dark",
    density: "concise",
    label: "省流版 / 玄奥玄色"
  },
  {
    key: "concise-light",
    theme: "gentle-light",
    density: "concise",
    label: "省流版 / 明亮护眼"
  }
];
