import { Schema } from "effect";

export const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";
export const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/api/token";

export const SpotifyId = Schema.String.pipe(Schema.brand("SpotifyId"));
export const SpotifyHref = Schema.String.pipe(Schema.brand("SpotifyHref"));

export class ExternalUrl extends Schema.Class<ExternalUrl>("ExternalUrl")({
  spotify: Schema.String,
}) { }

export class Image extends Schema.Class<Image>("Image")({
  url: Schema.URL,
  height: Schema.Number,
  width: Schema.Number,
}) { }

export class Artist extends Schema.Class<Artist>("Artist")({
  id: SpotifyId,
  href: SpotifyHref,
  name: Schema.String,
  externalUrls: Schema.propertySignature(ExternalUrl).pipe(Schema.fromKey("external_urls")),
  type: Schema.Literal("artist"),
}) { }

export class Album extends Schema.Class<Album>("Album")({
  albumType: Schema.propertySignature(Schema.Literal("album", "single", "compilation")).pipe(
    Schema.fromKey("album_type"),
  ),
  totalTracks: Schema.propertySignature(Schema.Number).pipe(Schema.fromKey("total_tracks")),
  href: SpotifyHref,
  id: SpotifyId,
  images: Schema.Array(Image),
  name: Schema.String,
  artists: Schema.Array(Artist),
  externalUrls: Schema.propertySignature(ExternalUrl).pipe(Schema.fromKey("external_urls")),
  type: Schema.Literal("album"),
}) { }

export class Track extends Schema.Class<Track>("Track")({
  album: Album,
  artists: Schema.Array(Artist),
  durationMs: Schema.propertySignature(Schema.Number).pipe(Schema.fromKey("duration_ms")),
  explicit: Schema.Boolean,
  href: SpotifyHref,
  id: SpotifyId,
  name: Schema.String,
  externalUrls: Schema.propertySignature(ExternalUrl).pipe(Schema.fromKey("external_urls")),
  type: Schema.Literal("track"),
}) { }
