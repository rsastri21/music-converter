import { HttpApiBuilder } from "@effect/platform";
import { Effect, Match, pipe } from "effect";
import { DomainApi } from "src/domain/domain-api.js";
import { MusicServiceProvider } from "src/domain/provider-shape.js";
import {
  type AVAILABLE_PROVIDERS,
  type SUPPORTED_SEARCH_TYPES,
  TypeaheadResponse,
  type SearchRequest,
  ResolveResponse,
} from "src/domain/search-contract.js";
import { MusicServiceProviderMap } from "src/providers/provider-map.js";
import { SpotifySearchError } from "src/providers/spotify/models/api-contract.js";

const handleTypeaheadSearch = Effect.fnUntraced(function*(query: string) {
  const provider = yield* MusicServiceProvider;
  const result = yield* provider.search(query);
  return TypeaheadResponse.make({
    mode: "typeahead",
    from: provider.providerId,
    ...result,
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Item = ResolveResponse.pick("item").Type;
type ItemType = (typeof Item)["item"];

const makeResolveResponse = (item: ItemType, providerId: typeof AVAILABLE_PROVIDERS.Type) =>
  ResolveResponse.make({
    mode: "resolve",
    from: providerId,
    item,
  });

const handleResolveSearch = Effect.fnUntraced(
  function*(query: string, type: typeof SUPPORTED_SEARCH_TYPES.Type) {
    const provider = yield* MusicServiceProvider;
    const result = yield* provider.search(query);

    switch (type) {
      case "artist": {
        yield* Effect.fail(new SpotifySearchError({ message: "No results." })).pipe(
          Effect.when(() => result.artists.length == 0),
        );
        return makeResolveResponse(result.artists[0], provider.providerId);
      }
      case "album": {
        yield* Effect.fail(new SpotifySearchError({ message: "No results." })).pipe(
          Effect.when(() => result.albums.length == 0),
        );
        return makeResolveResponse(result.albums[0], provider.providerId);
      }
      case "track": {
        yield* Effect.fail(new SpotifySearchError({ message: "No results." })).pipe(
          Effect.when(() => result.tracks.length == 0),
        );
        return makeResolveResponse(result.tracks[0], provider.providerId);
      }
    }
  },
  (effect) => pipe(effect, Effect.catchAll(Effect.die)),
);

export const SearchLive = HttpApiBuilder.group(DomainApi, "search", (handlers) => {
  const searchMatcher = (input: typeof SearchRequest.Type) =>
    Match.value(input).pipe(
      Match.when({ mode: "typeahead" }, ({ provider, query }) =>
        handleTypeaheadSearch(query).pipe(Effect.provide(MusicServiceProviderMap.get(provider))),
      ),
      Match.when({ mode: "resolve" }, ({ provider, query, type }) =>
        handleResolveSearch(query, type).pipe(Effect.provide(MusicServiceProviderMap.get(provider))),
      ),
      Match.orElse(() => Effect.die("Not implemented yet.")),
    );

  return handlers.handle("search", (request) => searchMatcher(request.urlParams));
});
