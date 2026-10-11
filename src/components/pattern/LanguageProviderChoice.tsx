import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  LANGUAGE_PROVIDER_LABELS,
  LANGUAGE_PROVIDERS,
  type LanguageProvider,
} from "@/lib/ai/diagnostics";
import { fetchLanguageProviders } from "@/lib/pattern.functions";

/** Admin-only provider choice; each run and draft records the model identity that wrote it. */
export function LanguageProviderChoice({
  value,
  onChange,
  disabled = false,
}: {
  value: LanguageProvider;
  onChange: (provider: LanguageProvider) => void;
  disabled?: boolean;
}) {
  const { session } = useAuth();
  const labelId = useId();
  const providersFn = useServerFn(fetchLanguageProviders);
  const query = useQuery({
    queryKey: ["language-providers", session?.userId],
    queryFn: () => providersFn({}),
    enabled: Boolean(session),
  });
  // Unknown status leaves every provider selectable; the server still reports missing keys.
  const configured = new Map(
    query.data?.providers.map((provider) => [provider.id, provider.configured] as const),
  );
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
            disabled={disabled || configured.get(id) === false}
            onClick={() => onChange(id)}
            className="min-h-11 whitespace-normal aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
          >
            {LANGUAGE_PROVIDER_LABELS[id]}
            {configured.get(id) === false ? " · not configured" : ""}
          </Button>
        ))}
      </div>
      {configured.get("gemini-enterprise") === false ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Gemini Enterprise needs a GEMINI_ENTERPRISE_API_KEY secret on the server.
        </p>
      ) : null}
    </div>
  );
}
