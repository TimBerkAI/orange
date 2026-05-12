import { type CSSProperties } from "react";
import { colors } from "@/shared/config/theme";

interface SpinnerProps {
  size?: number;
}

export function Spinner({ size = 24 }: SpinnerProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    border: `2px solid ${colors.borderLight}`,
    borderTopColor: colors.primary,
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={style} />
    </>
  );
}
