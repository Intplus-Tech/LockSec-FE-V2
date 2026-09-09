/**
 * Turn rows into a CSV file and hand it to the browser.
 *
 * Two details that matter more than they look:
 *
 * 1. A field containing a comma, a quote or a newline must be wrapped in
 *    quotes with inner quotes doubled. Skipping this is why so many exported
 *    CSVs break the moment someone has a comma in their address.
 *
 * 2. The BOM at the front. Without it, Excel on Windows opens UTF-8 as
 *    Latin-1 and renders ₦ as a pair of mojibake characters. Every naira
 *    figure in the file would look corrupted.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: unknown[][],
) {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Release the object URL, or the blob stays in memory for the life of the
  // page. Easy to forget and invisible until someone exports fifty times.
  URL.revokeObjectURL(url);
}
