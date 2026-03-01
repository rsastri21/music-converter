import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

export const AVAILABLE_PROVIDERS = Schema.Literal("spotify");

export class TrackDao extends Schema.Class<TrackDao>("TrackDao")({
  id: Schema.String,
  name: Schema.String,
  artists: Schema.Array(Schema.String),
  album: Schema.String,
  thumbnail: Schema.String,
  art: Schema.String,
  shareUrls: Schema.Array(Schema.String),
  type: Schema.Literal("track"),
}) { }

export class ArtistDao extends Schema.Class<ArtistDao>("ArtistDao")({
  id: Schema.String,
  name: Schema.String,
  thumbnail: Schema.String,
  art: Schema.String,
  shareUrls: Schema.Array(Schema.String),
  type: Schema.Literal("artist"),
}) { }

export class AlbumDao extends Schema.Class<AlbumDao>("AlbumDao")({
  id: Schema.String,
  name: Schema.String,
  artist: Schema.String,
  thumbnail: Schema.String,
  art: Schema.String,
  shareUrls: Schema.Array(Schema.String),
  type: Schema.Literal("album"),
}) { }

// Typeahead models

export class TypeaheadRequest extends Schema.Class<TypeaheadRequest>("TypeaheadRequest")({
  mode: Schema.Literal("typeahead"),
  provider: AVAILABLE_PROVIDERS,
  query: Schema.String,
}) { }

export const TypeaheadResponse = Schema.Struct({
  mode: Schema.Literal("typeahead"),
  tracks: Schema.Array(TrackDao),
  artists: Schema.Array(ArtistDao),
  albums: Schema.Array(AlbumDao),
  from: AVAILABLE_PROVIDERS,
});

// Resolve models

export class ResolveRequest extends Schema.Class<ResolveRequest>("ResolveRequest")({
  mode: Schema.Literal("resolve"),
  provider: AVAILABLE_PROVIDERS, // Default to the user's requested provider for art
  type: Schema.Literal("album", "artist", "track"),
  query: Schema.String,
}) { }

export const ResolveResponse = Schema.Struct({
  mode: Schema.Literal("resolve"),
  from: AVAILABLE_PROVIDERS,
  item: Schema.Union(TrackDao, ArtistDao, AlbumDao),
});

// Joint model

export const SearchRequest = Schema.Union(ResolveRequest, TypeaheadRequest);
export const SearchResponse = Schema.Union(ResolveResponse, TypeaheadResponse);

export class SearchGroup extends HttpApiGroup.make("search").add(
  HttpApiEndpoint.get("search", "/search").addSuccess(SearchResponse).setUrlParams(SearchRequest),
) { }
