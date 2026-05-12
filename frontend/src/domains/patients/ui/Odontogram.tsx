import { useCallback, useState } from "react";
import { colors, radius, shadows, spacing, typography } from "@/shared/config/theme";
import {
  TOOTH_STATUS_BORDER,
  TOOTH_STATUS_COLORS,
  TOOTH_STATUS_LABELS,
} from "../constants";
import { ToothIcon } from "./ToothIcon";
import type { OdontogramEntry, ToothStatusValue } from "../types";

interface OdontogramProps {
  entries: OdontogramEntry[];
  onUpdateEntry?: (toothId: number, status: ToothStatusValue) => void;
  readonly?: boolean;
}

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

const ALL_STATUSES: ToothStatusValue[] = [
  "healthy", "caries", "treated", "crown", "extracted", "implant", "filling",
];

export function Odontogram({ entries, onUpdateEntry, readonly = false }: OdontogramProps) {
  const [popover, setPopover] = useState<{ toothId: number; x: number; y: number } | null>(null);

  const entryMap = new Map(entries.map((e) => [e.tooth.number, e]));

  const handleToothClick = useCallback(
    (toothNumber: number, event: React.MouseEvent) => {
      if (readonly || !onUpdateEntry) return;
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const container = (event.currentTarget as HTMLElement).closest("[data-odontogram]");
      const containerRect = container?.getBoundingClientRect() ?? rect;
      setPopover({
        toothId: toothNumber,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.bottom - containerRect.top + 4,
      });
    },
    [readonly, onUpdateEntry],
  );

  const handleStatusSelect = useCallback(
    (status: ToothStatusValue) => {
      if (popover && onUpdateEntry) {
        const entry = entryMap.get(popover.toothId);
        if (entry) onUpdateEntry(entry.tooth.id, status);
      }
      setPopover(null);
    },
    [popover, onUpdateEntry, entryMap],
  );

  const renderTooth = (number: number, isLower: boolean) => {
    const entry = entryMap.get(number);
    const status: ToothStatusValue = (entry?.status as ToothStatusValue) ?? "healthy";
    const isActive = popover?.toothId === number;

    return (
      <div
        key={number}
        onClick={(e) => handleToothClick(number, e)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1px",
          cursor: readonly ? "default" : "pointer",
          transition: "transform 0.1s ease",
          transform: isActive ? "scale(1.1)" : "scale(1)",
        }}
      >
        <ToothIcon
          toothNumber={number}
          status={status}
          isActive={isActive}
          isLower={isLower}
          size={34}
        />
        <span
          style={{
            fontSize: "10px",
            color: colors.textSecondary,
            fontWeight: "500",
            lineHeight: 1,
          }}
        >
          {number}
        </span>
      </div>
    );
  };

  const renderRow = (teeth: number[], label: string, isLower: boolean) => (
    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
      <span
        style={{
          fontSize: "10px",
          color: colors.textMuted,
          width: 14,
          textAlign: "center",
          flexShrink: 0,
          lineHeight: "34px",
        }}
      >
        {label}
      </span>
      {teeth.map((n) => renderTooth(n, isLower))}
    </div>
  );

  return (
    <div
      data-odontogram
      style={{ position: "relative", display: "inline-block" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm,
          padding: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderLight}`,
          overflowX: "auto",
        }}
      >
        <div style={{ display: "flex", gap: spacing.md, justifyContent: "center" }}>
          {renderRow(UPPER_RIGHT, "R", false)}
          <div style={{ width: 1, backgroundColor: colors.border, alignSelf: "stretch" }} />
          {renderRow(UPPER_LEFT, "L", false)}
        </div>

        <div
          style={{
            height: 1,
            backgroundColor: colors.border,
            margin: `0 ${spacing.md}`,
          }}
        />

        <div style={{ display: "flex", gap: spacing.md, justifyContent: "center" }}>
          {renderRow(LOWER_RIGHT, "R", true)}
          <div style={{ width: 1, backgroundColor: colors.border, alignSelf: "stretch" }} />
          {renderRow(LOWER_LEFT, "L", true)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: spacing.sm,
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: spacing.sm,
          padding: `0 ${spacing.sm}`,
        }}
      >
        {ALL_STATUSES.map((s) => (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "10px",
              color: colors.textSecondary,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "2px",
                border: `1px solid ${TOOTH_STATUS_BORDER[s]}`,
                backgroundColor: TOOTH_STATUS_COLORS[s],
              }}
            />
            {TOOTH_STATUS_LABELS[s]}
          </div>
        ))}
      </div>

      {popover && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 50 }}
            onClick={() => setPopover(null)}
          />
          <div
            style={{
              position: "absolute",
              left: popover.x,
              top: popover.y,
              transform: "translateX(-50%)",
              zIndex: 51,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              border: `1px solid ${colors.border}`,
              boxShadow: shadows.md,
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              minWidth: 120,
            }}
          >
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusSelect(s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "5px 8px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  fontSize: typography.caption.fontSize,
                  color: colors.textPrimary,
                  textAlign: "left",
                  transition: "background-color 0.1s",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "3px",
                    border: `1px solid ${TOOTH_STATUS_BORDER[s]}`,
                    backgroundColor: TOOTH_STATUS_COLORS[s],
                    flexShrink: 0,
                  }}
                />
                {TOOTH_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
