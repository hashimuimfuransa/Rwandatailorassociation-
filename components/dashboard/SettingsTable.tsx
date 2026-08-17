import { EyeOff, Lock } from "lucide-react";
import { getDashboardCopy } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/fill";
import { formatDate } from "@/lib/i18n/dates";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import type { getSettings } from "@/lib/services/admin-queries";

type Setting = Awaited<ReturnType<typeof getSettings>>[number];

/**
 * Stored `SystemSetting` rows, grouped by category.
 *
 * Secret values are never rendered — `getSettings` replaces them with null
 * before they leave the server, so this component only ever knows whether a
 * credential is configured, not what it is. That is deliberate: a provider
 * secret must not end up in an HTML payload, a browser cache or a screenshot.
 */
export async function SettingsTable({
  settings,
  emptyMessage,
}: {
  settings: Setting[];
  emptyMessage: string;
}) {
  const { d, locale } = await getDashboardCopy();
  const copy = d.views.settings;

  if (settings.length === 0) {
    return (
      <TableWrapper>
        <Table>
          <TableBody>
            <TableEmpty colSpan={1}>{emptyMessage}</TableEmpty>
          </TableBody>
        </Table>
      </TableWrapper>
    );
  }

  const byCategory = new Map<string, Setting[]>();
  for (const setting of settings) {
    const list = byCategory.get(setting.category) ?? [];
    list.push(setting);
    byCategory.set(setting.category, list);
  }

  return (
    <div className="space-y-5">
      {[...byCategory.entries()].map(([category, rows]) => (
        <div key={category}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {category.replace(/_/g, " ")}
          </h3>
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.colSetting}</TableHead>
                  <TableHead>{copy.colValue}</TableHead>
                  <TableHead>{copy.colType}</TableHead>
                  <TableHead>{copy.colLastChanged}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell>
                      <span className="block font-medium text-ink">
                        {setting.label ?? setting.key}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">
                        {setting.key}
                      </span>
                      {setting.description && (
                        <span className="mt-1 block max-w-md text-xs text-ink-muted">
                          {setting.description}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="max-w-xs">
                      {setting.isSecret ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                          <EyeOff className="size-3.5" aria-hidden="true" />
                          {setting.configured ? copy.configured : copy.notSet}
                        </span>
                      ) : (
                        <span className="block break-words font-mono text-xs text-ink">
                          {setting.value === "" ? "—" : setting.value}
                        </span>
                      )}
                      {!setting.isEditable && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-muted">
                          <Lock className="size-3" aria-hidden="true" />
                          {copy.platformManaged}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <StatusBadge
                        status={setting.valueType}
                        size="sm"
                        tone="neutral"
                        label={setting.valueType.toLowerCase()}
                      />
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {formatDate(setting.updatedAt, locale)}
                      {setting.updatedBy && (
                        <span className="mt-0.5 block text-[11px]">
                          {fill(copy.changedBy, { name: setting.updatedBy })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>
      ))}
    </div>
  );
}
