export const educationLevels = [
  {
    value: "hkdse_s4",
    label: "HKDSE S4",
    framework: "HKDSE"
  },
  {
    value: "hkdse_s5",
    label: "HKDSE S5",
    framework: "HKDSE"
  },
  {
    value: "hkdse_s6",
    label: "HKDSE S6",
    framework: "HKDSE"
  },
  {
    value: "hkqf_level_1",
    label: "HKQF Level 1",
    framework: "HKQF"
  },
  {
    value: "hkqf_level_2",
    label: "HKQF Level 2",
    framework: "HKQF"
  },
  {
    value: "hkqf_level_3",
    label: "HKQF Level 3",
    framework: "HKQF"
  },
  {
    value: "hkqf_level_4",
    label: "HKQF Level 4",
    framework: "HKQF"
  },
  {
    value: "hkqf_level_5",
    label: "HKQF Level 5",
    framework: "HKQF"
  },
  {
    value: "hkqf_level_6",
    label: "HKQF Level 6",
    framework: "HKQF"
  },
  {
    value: "hkqf_level_7",
    label: "HKQF Level 7",
    framework: "HKQF"
  }
] as const;

export const educationLevelValues = educationLevels.map((level) => level.value);

export function getEducationLevelLabel(value: string | null | undefined) {
  return educationLevels.find((level) => level.value === value)?.label ?? value ?? "Not set";
}
