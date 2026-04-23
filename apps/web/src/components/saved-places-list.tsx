"use client";

import type { SavedLocationRecord } from "@relocateit/types";
import { useState } from "react";
import { CompareButton } from "./compare-button";
import { FavoriteButton } from "./favorite-button";

type SavedPlacesListProps = {
  initialComparedIds: string[];
  initialItems: SavedLocationRecord[];
};

export function SavedPlacesList({ initialComparedIds, initialItems }: SavedPlacesListProps) {
  const [comparedIds, setComparedIds] = useState(initialComparedIds);
  const [items, setItems] = useState(initialItems);
  const comparedItems = items.filter((item) => comparedIds.includes(item.locationId));
  const readyToCompareItems = items.filter((item) => !comparedIds.includes(item.locationId));
  const compareReadyCount = comparedItems.length;
  const comparePrompt =
    compareReadyCount >= 2
      ? {
          title: "Your compare set is ready.",
          body: "You already have enough shortlist options lined up for a side-by-side decision pass.",
          primaryHref: "/compare",
          primaryLabel: `Continue compare (${compareReadyCount})`
        }
      : compareReadyCount === 1
        ? {
            title: "Add one more place to compare.",
            body: "One finalist is already in compare. Add one more strong option from your shortlist to unlock a clearer side-by-side decision.",
            primaryHref: "/compare",
            primaryLabel: "View compare"
          }
        : {
            title: "Start turning your shortlist into a decision set.",
            body: "Save a few strong options first, then move two of them into compare when you are ready to weigh tradeoffs side by side.",
            primaryHref: "/results",
            primaryLabel: "Find more candidates"
          };

  if (items.length === 0) {
    return (
      <section className="panel empty-panel">
        <p className="eyebrow">Saved places</p>
        <h2>Your shortlist is empty.</h2>
        <p className="muted">
          Save a few promising locations from results or detail pages so you have a shortlist to
          revisit, compare, and narrow down.
        </p>
        <div className="helper-panel">
          <p>
            Start by saving two or three strong candidates. Once you have at least two, move them
            into compare for a clearer side-by-side decision.
          </p>
        </div>
        <div className="button-row">
          <a className="primary-button" href="/results">
            View recommendations
          </a>
          <a className="secondary-button" href="/">
            Open dashboard
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="stack">
      <section className="panel shortlist-panel">
        <div className="results-header shortlist-header">
          <div>
            <p className="eyebrow">Shortlist workspace</p>
            <h2>{items.length} saved place(s) ready for review</h2>
            <p className="muted">
              Keep strong options here, then move the best few into compare when you are ready to
              make a tighter decision.
            </p>
            <div className="status-row">
              <span className="status-chip status-chip-active">{items.length} saved</span>
              <span className="status-chip">
                {compareReadyCount} in compare
              </span>
              <span className="status-chip">
                {readyToCompareItems.length} ready to compare next
              </span>
            </div>
          </div>
          <div className="header-actions">
            <a className="secondary-button" href="/results">
              View recommendations
            </a>
            <a className={compareReadyCount >= 2 ? "primary-button" : "secondary-button"} href="/compare">
              {compareReadyCount >= 2
                ? `Continue compare (${compareReadyCount})`
                : `View compare (${compareReadyCount})`}
            </a>
          </div>
        </div>
        <div className="saved-workspace-grid">
          <section className="helper-panel shortlist-helper">
            <p className="eyebrow">Next best move</p>
            <h3>{comparePrompt.title}</h3>
            <p className="muted">{comparePrompt.body}</p>
            <div className="button-row">
              <a className="primary-button" href={comparePrompt.primaryHref}>
                {comparePrompt.primaryLabel}
              </a>
              <a className="secondary-button" href="/results">
                Save more places
              </a>
            </div>
          </section>
          <section className="helper-panel shortlist-helper">
            <p className="eyebrow">How to use this shortlist</p>
            <ul className="plain-list shortlist-tips">
              <li>
                <strong>Keep your strongest options here first.</strong>
                <small>Saved places are your working shortlist, not your final answer.</small>
              </li>
              <li>
                <strong>Move finalists into compare once you have 2 or more.</strong>
                <small>That is when tradeoffs become easier to judge side by side.</small>
              </li>
              <li>
                <strong>Open details when you need context.</strong>
                <small>Use the detail page to see why a place fits, where it is strong, and what to watch.</small>
              </li>
            </ul>
          </section>
        </div>
      </section>

      {comparedItems.length > 0 ? (
        <section className="stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Already in compare</p>
              <h2>{comparedItems.length} place(s) in your decision set</h2>
              <p className="muted">
                These places are already lined up for side-by-side review. Keep them there if they
                still feel like finalists.
              </p>
            </div>
          </div>
          {comparedItems.map((item) => renderSavedCard(item, true))}
        </section>
      ) : null}

      {readyToCompareItems.length > 0 ? (
        <section className="stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ready to compare next</p>
              <h2>{readyToCompareItems.length} shortlist candidate(s) still waiting</h2>
              <p className="muted">
                These saved places are not in compare yet. Add your best remaining options when you
                are ready to pressure-test tradeoffs.
              </p>
            </div>
          </div>
          {readyToCompareItems.map((item) => renderSavedCard(item, false))}
        </section>
      ) : null}
    </section>
  );

  function renderSavedCard(item: SavedLocationRecord, isCompared: boolean) {
    return (
      <article
        key={item.id}
        className={`panel saved-card ${isCompared ? "saved-card-compare" : ""}`}
      >
        <div className="saved-card-top">
          <div className="saved-card-copy">
            <div className="saved-card-heading">
              <div>
                <p className="eyebrow">{isCompared ? "Compared place" : "Saved place"}</p>
                <h3>
                  <a href={`/locations/${item.location.slug}`}>
                    {item.location.name}, {item.location.state}
                  </a>
                </h3>
              </div>
              <div className="status-row">
                <span className="status-chip status-chip-active">Saved</span>
                <span className={`status-chip ${isCompared ? "status-chip-active" : ""}`}>
                  {isCompared ? "In compare" : "Ready to compare"}
                </span>
              </div>
            </div>
            <p className="muted">
              Population {item.location.population.toLocaleString()} {" | "}{" "}
              {item.location.description}
            </p>
            <p className="muted helper-copy">
              {isCompared
                ? "This place is already in your side-by-side decision set."
                : "This place is saved on your shortlist and can be added to compare when you want a tighter decision."}
            </p>
          </div>
          <div className="saved-card-actions">
            <a className="secondary-button" href={`/locations/${item.location.slug}`}>
              Open details
            </a>
            <CompareButton
              currentCount={comparedIds.length}
              initialCompared={isCompared}
              locationId={item.locationId}
              onToggle={(nextCompared) => {
                setComparedIds((current) =>
                  nextCompared
                    ? [...current, item.locationId]
                    : current.filter((entry) => entry !== item.locationId)
                );
              }}
            />
            <FavoriteButton
              initialSaved
              locationId={item.locationId}
              onToggle={(nextSaved) => {
                if (!nextSaved) {
                  setItems((current) =>
                    current.filter((entry) => entry.locationId !== item.locationId)
                  );
                  setComparedIds((current) =>
                    current.filter((entry) => entry !== item.locationId)
                  );
                }
              }}
            />
          </div>
        </div>
      </article>
    );
  }
}
