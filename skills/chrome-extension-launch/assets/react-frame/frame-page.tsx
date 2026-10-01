// SKILL NOTE: for React/Next extension UIs. Copy to app/store-shots/frame/page.tsx, swap OverlayCard for your component. Mirror EVERY state of the real UI as a pose mode (Switchit: list, loading, finding, edit) and expose spinners via --spin. Strip app/store-shots from the build (see store-assets.md).
"use client";

/**
 * The real overlay, alone on a transparent page, for store art and the promo video.
 *
 * store/templates/* and store/video/promo.html load this route in same-origin iframes
 * (through store/serve.js) and drive it with `window.__pose(props)`. Posing is synchronous
 * (flushSync), so a video frame can pose, measure and capture without waiting.
 *
 * Modes mirror components/profile-switcher.tsx:
 * - "list"     the switcher (OverlayCard): Active marker, access results, spinners while checking
 * - "loading"  "Loading accounts…" before storage answers
 * - "finding"  an empty list while discovery runs ("Finding accounts…")
 * - "edit"     the settings panel (theme, sort, avatar / email, reorder, rename, ID lock, hide, forget, add)
 * `spin` (degrees) poses the Loader2 spinners, which are otherwise frozen for captures.
 * Fixture data lives in store/fixtures/scenes.js. Stripped from the extension build by
 * scripts/extension-cleanup.js.
 */

import * as React from "react";
import { flushSync } from "react-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  ListOrdered,
  Loader2,
  Lock,
  Monitor,
  Moon,
  Plus,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OverlayCard, type OverlayAccountView, type OverlayHeaderAction } from "@/components/overlay-card";

type EditAccount = OverlayAccountView & {
  fixedId?: string;
  isVisible?: boolean;
  isConflict?: boolean;
};

type Pose = {
  theme?: "light" | "dark";
  mode?: "list" | "loading" | "finding" | "edit";
  spin?: number;
  hostName: string;
  favicon?: string;
  currentUrl?: string;
  query?: string;
  accounts: EditAccount[];
  highlightedIndex?: number;
  providerId: string;
  showAccessState?: boolean;
  headerActions?: OverlayHeaderAction[];
  copiedLink?: boolean;
  emptyMessage?: string;
  // edit mode
  themePref?: "system" | "light" | "dark";
  showAvatar?: boolean;
  showEmail?: boolean;
  focus?: { row: number; field: "name" | "id" } | null;
  pressed?: string | null; // "theme" | "sort" | "avatar" | "email" | "eye-<i>" | "up-<i>" | "down-<i>" | "add" | "done"
};

declare global {
  interface Window {
    __pose?: (pose: Pose) => { width: number; height: number };
    __imagesReady?: () => Promise<void>;
  }
}

let wantDark = false;

function applyTheme() {
  const root = document.documentElement;
  if (root.classList.contains("dark") !== wantDark) root.classList.toggle("dark", wantDark);
  root.style.colorScheme = wantDark ? "dark" : "light";
}

export default function OverlayFrame() {
  const [pose, setPose] = React.useState<Pose | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = document.documentElement;
    // ThemeProvider follows the system theme; a frame keeps the theme it was posed with.
    const keepTheme = new MutationObserver(applyTheme);
    keepTheme.observe(root, { attributes: true, attributeFilter: ["class"] });
    const dropDevUi = new MutationObserver(() => {
      document.querySelectorAll("nextjs-portal").forEach((node) => node.remove());
    });
    dropDevUi.observe(root, { childList: true, subtree: true });
    const spinStyle = document.createElement("style");
    spinStyle.textContent = ".animate-spin{animation:none!important;transform:rotate(var(--spin,0deg))}";
    document.head.appendChild(spinStyle);

    window.__pose = (next) => {
      wantDark = next.theme === "dark";
      applyTheme();
      root.style.setProperty("--spin", `${next.spin ?? 0}deg`);
      flushSync(() => setPose(next));
      const box = cardRef.current?.getBoundingClientRect();
      return { width: Math.ceil(box?.width ?? 0), height: Math.ceil(box?.height ?? 0) };
    };
    window.__imagesReady = () =>
      Promise.all(
        Array.from(document.images).map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                image.addEventListener("load", () => resolve(), { once: true });
                image.addEventListener("error", () => resolve(), { once: true });
              })
        )
      ).then(() => undefined);
    root.dataset.frameReady = "1";
    return () => {
      keepTheme.disconnect();
      dropDevUi.disconnect();
    };
  }, []);

  if (!pose) return null;
  const mode = pose.mode ?? "list";
  return (
    <div ref={cardRef} className="inline-block align-top" data-overlay-frame data-mode={mode}>
      {mode === "loading" ? (
        // profile-switcher.tsx, while storage loads
        <div className="w-[480px] bg-card text-card-foreground border border-border/60 rounded-2xl px-4 py-3 flex items-center gap-2 font-sans">
          <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading accounts…</span>
        </div>
      ) : mode === "edit" ? (
        <EditCard pose={pose} />
      ) : (
        <OverlayCard
          hostName={pose.hostName}
          favicon={pose.favicon}
          currentUrl={pose.currentUrl}
          query={pose.query ?? ""}
          accounts={mode === "finding" ? [] : pose.accounts}
          highlightedIndex={pose.highlightedIndex ?? -1}
          providerId={pose.providerId}
          showAccessState={pose.showAccessState}
          headerActions={pose.headerActions}
          copiedLink={pose.copiedLink}
          emptyMessage={mode === "finding" ? "Finding accounts…" : pose.emptyMessage}
          readOnly
        />
      )}
    </div>
  );
}

/** The settings panel, markup and classes as in profile-switcher.tsx (edit mode). */
function EditCard({ pose }: { pose: Pose }) {
  const pressed = (id: string) => pose.pressed === id && "scale-[0.94] ring-2 ring-primary/40";
  const chip = (on: boolean) =>
    cn(
      "flex items-center gap-1.5 px-2 h-7 rounded-md text-[11px] font-medium",
      on ? "bg-primary/15 text-primary" : "bg-muted/70 text-muted-foreground"
    );
  const showAvatar = pose.showAvatar !== false;
  const showEmail = pose.showEmail !== false;
  const google = pose.providerId === "google";
  return (
    <div className="w-[480px] bg-card text-card-foreground border border-border/60 rounded-2xl overflow-hidden font-sans">
      <div className="flex items-center gap-3 px-3.5 h-12 border-b border-border/40">
        {pose.favicon ? <img src={pose.favicon} alt="" className="h-4 w-4 object-contain shrink-0" /> : null}
        <div className="flex-1 text-sm text-muted-foreground">Edit accounts</div>
        <span className={cn("h-7 w-7 rounded-md flex items-center justify-center bg-muted text-foreground", pressed("done"))}>
          <Check className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="p-2">
        <div className="space-y-1.5">
          <div className="flex justify-end flex-wrap gap-1 mb-1 px-1">
            <span data-edit="theme" className={cn("h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground shrink-0", pressed("theme"))}>
              {pose.themePref === "dark" ? <Moon className="h-3.5 w-3.5" /> : pose.themePref === "light" ? <Sun className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
            </span>
            {google && (
              <span data-edit="sort" className={cn(chip(false), pressed("sort"))}>
                <ListOrdered className="h-3 w-3 shrink-0" />
                <span>Sort</span>
              </span>
            )}
            <span data-edit="avatar" className={cn(chip(showAvatar), pressed("avatar"))}>
              <User className="h-3 w-3" />
              <span>{showAvatar ? "Avatar" : "No avatar"}</span>
            </span>
            <span data-edit="email" className={cn(chip(showEmail), pressed("email"))}>
              <div className="h-3 w-3 flex items-center justify-center font-semibold">@</div>
              <span>{showEmail ? "Email" : "No email"}</span>
            </span>
          </div>
          {pose.accounts.map((account, index) => {
            const focusName = pose.focus?.row === index && pose.focus.field === "name";
            const focusId = pose.focus?.row === index && pose.focus.field === "id";
            return (
              <div
                key={account.email || index}
                data-edit-row={index}
                className={cn(
                  "flex flex-col gap-1.5 px-2 py-2 rounded-xl border",
                  account.isConflict
                    ? "bg-rose-500/8 border-rose-500/25"
                    : account.isVisible === false
                      ? "bg-muted/25 border-border/40 opacity-80"
                      : "bg-card border-border/50"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center">
                    <span data-edit={`up-${index}`} className={cn("p-1 rounded-md text-muted-foreground", pressed(`up-${index}`))}><ArrowUp className="h-3 w-3" /></span>
                    <span data-edit={`down-${index}`} className={cn("p-1 rounded-md text-muted-foreground", pressed(`down-${index}`))}><ArrowDown className="h-3 w-3" /></span>
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div
                        data-edit={`name-${index}`}
                        className={cn(
                          "flex-1 min-w-0 h-8 rounded-md bg-background border border-border/70 px-2 text-sm flex items-center truncate",
                          focusName && "border-primary/60 ring-2 ring-primary/20"
                        )}
                      >
                        {account.name}
                        {focusName && <span className="ml-px inline-block w-px h-4 bg-foreground" />}
                      </div>
                      <div className="relative shrink-0">
                        <div
                          className={cn(
                            google
                              ? "w-14 h-8 rounded-md bg-muted/50 border border-border/70 px-1.5 text-sm font-mono flex items-center justify-center"
                              : "w-28 h-8 rounded-md bg-muted/50 border border-border/70 px-2 text-xs flex items-center truncate",
                            account.isConflict
                              ? "text-rose-600 dark:text-rose-400 pr-5 border-rose-500/40"
                              : account.fixedId
                                ? "text-amber-700 dark:text-amber-400 pr-5 border-amber-500/30"
                                : "",
                            focusId && "border-primary/60 ring-2 ring-primary/20"
                          )}
                        >
                          {google ? account.fixedId ?? account.id : account.id}
                        </div>
                        {google && account.isConflict && !account.fixedId && (
                          <div className="absolute right-1 top-2"><AlertCircle className="h-3.5 w-3.5 text-rose-500" /></div>
                        )}
                        {google && account.fixedId && !account.isConflict && (
                          <div className="absolute right-1 top-2"><Lock className="h-3.5 w-3.5 text-amber-500" /></div>
                        )}
                      </div>
                    </div>
                    {showEmail && (
                      <div className="w-full h-7 rounded-md bg-muted/40 border border-border/50 px-2 text-xs text-muted-foreground flex items-center truncate">
                        {account.email}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span
                      data-edit={`eye-${index}`}
                      className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center",
                        account.isVisible !== false ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                        pressed(`eye-${index}`)
                      )}
                    >
                      {account.isVisible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </span>
                    <span data-edit={`trash-${index}`} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground">
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
                {account.isConflict && (
                  <div className="text-[10px] text-rose-600 flex items-center gap-1 px-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>ID Conflict: Check other accounts.</span>
                  </div>
                )}
              </div>
            );
          })}
          <div data-edit="add" className={cn("w-full h-9 flex items-center justify-center gap-2 text-[13px] rounded-xl border border-dashed border-border/70 text-muted-foreground", pressed("add"))}>
            <Plus className="h-3.5 w-3.5" /> Add account
          </div>
        </div>
      </div>
      <div className="h-9 px-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{pose.hostName}</span>
        <span>Saved automatically</span>
      </div>
    </div>
  );
}
