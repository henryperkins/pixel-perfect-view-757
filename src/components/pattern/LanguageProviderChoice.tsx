import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  LANGUAGE_PROVIDER_LABELS,
  LANGUAGE_PROVIDERS,
  type LanguageProvider,
} from "@/lib/ai/diagnostics";

export type LanguageProviderStatus = Partial<Record<LanguageProvider, boolean>>;

/** Admin-only provider choice; each run and draft records the model identity that wrote it. */
export function LanguageProviderChoice({
  value,
  onChange,
  disabled = false,
  configured,
}: {
  value: LanguageProvider;
  onChange: (provider: LanguageProvider) => void;
  disabled?: boolean;
  /** Unknown status leaves every provider selectable; the server still reports missing keys. */
  configured?: LanguageProviderStatus | undefined;
}) {
  const labelId = useId();
  return (
    <div className="min-w-0">
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex min-w-0 flex-wrap items-center gap-2"
      >
        <span id={labelId} className="technical text-muted-foreground">
          Language provider
        </span>
        {LANGUAGE_PROVIDERS.map((id) => (
          <Button
            key={id}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={value === id}
            disabled={disabled || configured?.[id] === false}
            onClick={() => onChange(id)}
            className="min-h-11 whitespace-normal aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
          >
            {LANGUAGE_PROVIDER_LABELS[id]}
            {configured?.[id] === false ? " · not configured" : ""}
          </Button>
        ))}
      </div>
      {configured?.["gemini-enterprise"] === false ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Gemini Enterprise needs a GEMINI_ENTERPRISE_API_KEY secret on the server.
        </p>
      ) : null}
    </div>
  );
}
