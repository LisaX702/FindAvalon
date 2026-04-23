"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeFavorite, saveFavorite } from "../lib/api";

type FavoriteButtonProps = {
  initialSaved: boolean;
  locationId: string;
  onToggle?: (nextSaved: boolean) => void;
};

export function FavoriteButton({
  initialSaved,
  locationId,
  onToggle
}: FavoriteButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError(null);

    startTransition(() => {
      const action = isSaved ? removeFavorite({ locationId }) : saveFavorite({ locationId });

      void action
        .then(() => {
          const nextSaved = !isSaved;
          setIsSaved(nextSaved);
          onToggle?.(nextSaved);
          router.refresh();
        })
        .catch((requestError) => {
          setError(requestError instanceof Error ? requestError.message : "Favorite update failed.");
        });
    });
  }

  return (
    <div className="favorite-control">
      <button
        type="button"
        className={isSaved ? "secondary-button" : "primary-button"}
        onClick={handleToggle}
        disabled={isPending}
      >
        {isPending ? "Saving..." : isSaved ? "Unsave" : "Save"}
      </button>
      {error ? <small className="error-text">{error}</small> : null}
    </div>
  );
}
