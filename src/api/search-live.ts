import { HttpApiBuilder } from "@effect/platform";
import { Effect, Match, Schema } from "effect";
import { DomainApi } from "src/domain/domain-api.js";
import { MusicServiceProvider } from "src/domain/provider-shape.js";
import {
  AVAILABLE_PROVIDERS,
  type SUPPORTED_SEARCH_TYPES,
  TypeaheadResponse,
  type SearchRequest,
  ResolveResponse,
  SearchError,
  type WithShareUrl,
} from "src/domain/search-contract.js";
import { MusicServiceProviderMap } from "src/providers/provider-map.js";

const handleTypeaheadSearch = Effect.fnUntraced(function* (query: string) {
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
  Schema.decodeUnknown(ResolveResponse)({ mode: "resolve", from: providerId, item });

const mergeShareUrls = <T extends typeof WithShareUrl.Type>(base: T, others: Array<T>): T => {
  const mergedSharedUrl = others.reduce(
    (acc, item) => ({
      ...acc,
      ...item.shareUrl,
    }),
    { ...base.shareUrl },
  );

  return {
    ...base,
    shareUrl: mergedSharedUrl,
  };
};

const handleResolveSearch = Effect.fnUntraced(function* (query: string, type: typeof SUPPORTED_SEARCH_TYPES.Type) {
  const provider = yield* MusicServiceProvider;
  const result = yield* provider.search(query);

  switch (type) {
    case "artist": {
      yield* Effect.fail(new SearchError({ message: "No results." })).pipe(
        Effect.when(() => result.artists.length == 0),
      );
      return result.artists[0];
    }
    case "album": {
      yield* Effect.fail(new SearchError({ message: "No results." })).pipe(
        Effect.when(() => result.albums.length == 0),
      );
      return result.albums[0];
    }
    case "track": {
      yield* Effect.fail(new SearchError({ message: "No results." })).pipe(
        Effect.when(() => result.tracks.length == 0),
      );
      return result.tracks[0];
    }
  }
});

export const SearchLive = HttpApiBuilder.group(DomainApi, "search", (handlers) => {
  const searchMatcher = (input: typeof SearchRequest.Type) =>
    Match.value(input).pipe(
      Match.when({ mode: "typeahead" }, ({ provider, query }) =>
        handleTypeaheadSearch(query).pipe(Effect.provide(MusicServiceProviderMap.get(provider))),
      ),
      Match.when({ mode: "resolve" }, ({ provider, query, type }) =>
        Effect.all({
          base: handleResolveSearch(query, type).pipe(Effect.provide(MusicServiceProviderMap.get(provider))),
          others: Effect.forEach(
            AVAILABLE_PROVIDERS.literals.filter((p) => p !== provider),
            (p) => handleResolveSearch(query, type).pipe(Effect.provide(MusicServiceProviderMap.get(p))),
            { concurrency: "unbounded" },
          ),
        }).pipe(
          Effect.map(({ base, others }) => mergeShareUrls(base, others)),
          Effect.flatMap((result) => makeResolveResponse(result, provider)),
          Effect.catchTag("ParseError", Effect.die),
        ),
      ),
      Match.orElse(() => Effect.die("Not implemented yet.")),
    );

  return handlers.handle("search", (request) => searchMatcher(request.urlParams));
});
