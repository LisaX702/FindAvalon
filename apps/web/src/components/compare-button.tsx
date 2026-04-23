"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToComparison, removeFromComparison } from "../lib/api";

type CompareButtonProps = {
  currentCount: number;
  initialCompared: boolean;
  locationId: string;
  maxLocations?: number;
  onToggle?: (nextCompared: boolean) => void;
};

export function CompareButton({
  currentCount,
  initialCompared,
  locationId,
  maxLocations = 4,
  onToggle
}: CompareButtonProps) {
  const router = useRouter();
  const [isCompared, setIsCompared] = useState(initialCompared);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError(null);

    if (!isCompared && currentCount >= maxLocations) {
      setError(`You can compare up to ${maxLocations} locations.`);
      return;
    }

    startTransition(() => {
      const action = isCompared
        ? removeFromComparison({ locationId })
        : addToComparison({ locationId });

      void action
        .then(() => {
          const nextCompared = !isCompared;
          setIsCompared(nextCompared);
          onToggle?.(nextCompared);
          router.refresh();
        })
        .catch((requestError) => {
          setError(requestError instanceof Error ? requestError.message : "Compare update failed.");
        });
    });
  }

  return (
    <div className="compare-control">
      <button
        type="button"
        className={isCompared ? "secondary-button" : "ghost-button"}
        onClick={handleToggle}
        disabled={isPending}
      >
        {isPending ? "Updating..." : isCompared ? "Remove compare" : "Compare"}
      </button>
      {error ? <small className="error-text">{error}</small> : null}
    </div>
  );
}
