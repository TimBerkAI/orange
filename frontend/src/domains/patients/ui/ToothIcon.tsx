import React from "react";
import { colors } from "@/shared/config/theme";
import { TOOTH_STATUS_BORDER, TOOTH_STATUS_COLORS } from "../constants";
import type { ToothStatusValue } from "../types";

interface ToothIconProps {
  toothNumber: number;
  status: ToothStatusValue;
  isActive?: boolean;
  isLower?: boolean;
  size?: number;
}

type ToothType = "incisor" | "canine" | "premolar" | "molar";

function getToothType(num: number): ToothType {
  const unit = num % 10;
  if (unit === 1 || unit === 2) return "incisor";
  if (unit === 3) return "canine";
  if (unit === 4 || unit === 5) return "premolar";
  return "molar";
}

function IncisorPath() {
  return (
    <path
      d="M12 2 C8 2, 5 5, 5 10 C5 14, 7 18, 8 22 C8 25, 9 28, 12 30 C15 28, 16 25, 16 22 C17 18, 19 14, 19 10 C19 5, 16 2, 12 2Z"
      strokeLinejoin="round"
    />
  );
}

function CaninePath() {
  return (
    <path
      d="M12 1 C9 1, 6 4, 6 9 C6 13, 7 16, 8 20 C9 24, 10 27, 12 31 C14 27, 15 24, 16 20 C17 16, 18 13, 18 9 C18 4, 15 1, 12 1Z"
      strokeLinejoin="round"
    />
  );
}

function PremolarPath() {
  return (
    <path
      d="M8 3 C5 3, 4 6, 4 10 C4 14, 5 18, 6 22 C7 26, 8 28, 12 30 C16 28, 17 26, 18 22 C19 18, 20 14, 20 10 C20 6, 19 3, 16 3 C14 3, 13 5, 12 5 C11 5, 10 3, 8 3Z"
      strokeLinejoin="round"
    />
  );
}

function MolarPath() {
  return (
    <path
      d="M7 4 C4 4, 3 7, 3 11 C3 15, 4 19, 5 23 C6 27, 8 29, 12 30 C16 29, 18 27, 19 23 C20 19, 21 15, 21 11 C21 7, 20 4, 17 4 C15 4, 14 6, 12 6 C10 6, 9 4, 7 4Z"
      strokeLinejoin="round"
    />
  );
}

const TOOTH_PATHS: Record<ToothType, () => React.JSX.Element> = {
  incisor: IncisorPath,
  canine: CaninePath,
  premolar: PremolarPath,
  molar: MolarPath,
};

export function ToothIcon({
  toothNumber,
  status,
  isActive = false,
  isLower = false,
  size = 36,
}: ToothIconProps) {
  const toothType = getToothType(toothNumber);
  const PathComponent = TOOTH_PATHS[toothType];
  const fillColor = TOOTH_STATUS_COLORS[status];
  const strokeColor = isActive ? colors.primary : TOOTH_STATUS_BORDER[status];
  const isExtracted = status === "extracted";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 32"
      style={{
        transform: isLower ? "scaleY(-1)" : "none",
        filter: isActive ? `drop-shadow(0 0 3px ${colors.primaryMedium})` : "none",
        transition: "transform 0.1s ease, filter 0.1s ease",
      }}
    >
      <g
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? 2 : 1.5}
      >
        <PathComponent />
      </g>
      {isExtracted && (
        <g stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round">
          <line x1="6" y1="8" x2="18" y2="24" />
          <line x1="18" y1="8" x2="6" y2="24" />
        </g>
      )}
    </svg>
  );
}
