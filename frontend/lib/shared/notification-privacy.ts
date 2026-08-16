export function redactNotificationRecipient(value: string) {
  if (value.includes("@")) {
    const [local, domain] = value.split("@", 2);
    return `${local.slice(0, 1)}***@${domain}`;
  }
  return value.length > 4 ? `***${value.slice(-4)}` : "***";
}
