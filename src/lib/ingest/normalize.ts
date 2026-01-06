export function normalizeIdentityValue(type: string, value: string): string {
  const v = value.trim();
  switch (type) {
    case "EMAIL":
      return v.toLowerCase();
    case "PHONE":
      return v.replace(/[^\d+]/g, "");
    default:
      return v;
  }
}

