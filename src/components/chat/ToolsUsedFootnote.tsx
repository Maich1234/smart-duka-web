/**
 * Which of the shop's real data an answer was grounded in.
 *
 * The one piece of UI that makes "this came from your books, not from a
 * language model's imagination" visible to the owner — worth keeping even
 * though it looks like a footnote.
 */
const TOOL_LABELS: Record<string, string> = {
  get_business_snapshot: 'business snapshot',
  get_daily_summary: 'daily summary',
  get_sales_trend: 'sales trend',
  get_peak_hours: 'peak hours',
  get_depletion_analytics: 'inventory data',
  detect_sales_anomaly: 'anomaly check',
  get_staff_performance: 'staff performance',
  get_expense_summary: 'expenses',
};

export default function ToolsUsedFootnote({ toolsUsed }: { toolsUsed: string[] }) {
  // Unknown keys fall through as-is rather than being dropped: a new
  // server-side tool should still be disclosed, even unprettified.
  const labels = toolsUsed.map((t) => TOOL_LABELS[t] ?? t).join(', ');
  return <p className="text-[11px] text-gray-400 mt-1 ml-1">Based on: {labels}</p>;
}
