export type AdminOrderExportRow = {
  id: string;
  amount: number;
  status: string;
  time: string;
  delivery: string;
};

function csvCell(value: string | number): string {
  const text = String(value);
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export function ordersToCsv(orders: AdminOrderExportRow[]): string {
  const header = ["Order number", "Amount (KES)", "Status", "Placed at", "Fulfillment"].join(",");
  const rows = orders.map((order) => [order.id, order.amount, order.status, order.time, order.delivery].map(csvCell).join(","));
  return [header, ...rows].join("\r\n") + "\r\n";
}
