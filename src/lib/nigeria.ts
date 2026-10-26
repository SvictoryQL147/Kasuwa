export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

/** Normalise "+234 803 ..." / "0803..." to 2348031234567 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^0[789][01]\d{8}$/.test(digits)) return "234" + digits.slice(1);
  if (/^234[789][01]\d{8}$/.test(digits)) return digits;
  return null;
}
