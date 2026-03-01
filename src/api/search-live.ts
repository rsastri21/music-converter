import { HttpApiBuilder } from "@effect/platform";
import { Effect, Match } from "effect";
import { DomainApi } from "src/domain/domain-api.js";
import { MusicServiceProvider } from "src/domain/provider-shape.js";
import { TypeaheadResponse, type SearchRequest } from "src/domain/search-contract.js";
import { MusicServiceProviderMap } from "src/providers/provider-map.js";

const handleTypeaheadSearch = Effect.fnUntraced(function*(query: string) {
  const provider = yield* MusicServiceProvider;
  const result = yield* provider.search(query);
  return TypeaheadResponse.make({
    mode: "typeahead",
    from: provider.providerId,
    ...result,
  });
});

export const SearchLive = HttpApiBuilder.group(DomainApi, "search", (handlers) => {
  const searchMatcher = (input: typeof SearchRequest.Type) =>
    Match.value(input).pipe(
      Match.when({ mode: "typeahead" }, ({ provider, query }) =>
        handleTypeaheadSearch(query).pipe(Effect.provide(MusicServiceProviderMap.get(provider))),
      ),
      Match.orElse(() => Effect.die("Not implemented yet.")),
    );

  return handlers.handle("search", (request) => searchMatcher(request.urlParams));
});
