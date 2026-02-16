import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import { SpotifySearchResponse } from "src/providers/spotify/models/api-contract.js";
import { Album, Artist, Track } from "src/providers/spotify/models/models.js";

export const AVAILABLE_PROVIDERS = Schema.Literal("spotify");

// Typeahead models

export class TypeaheadRequest extends Schema.Class<TypeaheadRequest>("TypeaheadRequest")({
  mode: Schema.Literal("typeahead"),
  provider: AVAILABLE_PROVIDERS,
  query: Schema.String,
}) { }

export const TypeaheadResponse = Schema.Struct({
  mode: Schema.Literal("typeahead"),
  items: Schema.Union(SpotifySearchResponse),
  from: AVAILABLE_PROVIDERS,
});

// Resolve models

export class ResolveRequest extends Schema.Class<ResolveRequest>("ResolveRequest")({
  mode: Schema.Literal("resolve"),
  type: Schema.Literal("album", "artist", "track"),
  query: Schema.String,
}) { }

class SpotifyResolveResponse extends Schema.Class<SpotifyResolveResponse>("SpotifyResolveResponse")({
  provider: Schema.Literal("spotify"),
  result: Schema.Union(Track, Artist, Album),
}) { }

export const ResolveResponse = Schema.Struct({
  mode: Schema.Literal("resolve"),
  items: Schema.Array(Schema.Union(SpotifyResolveResponse)),
});

// Joint model

export const SearchRequest = Schema.Union(ResolveRequest, TypeaheadRequest);
export const SearchResponse = Schema.Union(ResolveResponse, TypeaheadResponse);

export class SearchGroup extends HttpApiGroup.make("search").add(
  HttpApiEndpoint.get("search", "/search").addSuccess(SearchResponse).setUrlParams(SearchRequest),
) { }
