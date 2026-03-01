import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { DomainApi } from "src/domain/domain-api.js";
import { AVAILABLE_PROVIDERS } from "src/domain/search-contract.js";

export const ProviderLive = HttpApiBuilder.group(DomainApi, "provider", (handlers) => {
  return handlers.handle("providers", () => Effect.succeed(AVAILABLE_PROVIDERS.literals));
});
