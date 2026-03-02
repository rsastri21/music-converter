import { Data, Schema } from "effect";
import { Album, AppleMusicHref, Artist, Song } from "./models.js";

export class AppleMusicSearchError extends Data.TaggedError("AppleMusicSearchError")<{
  message: string;
  cause?: Error;
}> { }

export class AppleMusicGetError extends Data.TaggedError("AppleMusicGetError")<{
  message: string;
  cause?: Error;
}> { }

class BaseResponse extends Schema.Class<BaseResponse>("BaseResponse")({
  href: Schema.optional(AppleMusicHref),
  next: Schema.optional(AppleMusicHref),
}) { }

export class ArtistResponse extends BaseResponse.extend<ArtistResponse>("ArtistResponse")({
  data: Schema.Array(Artist),
}) { }

export class AlbumResponse extends BaseResponse.extend<AlbumResponse>("AlbumResponse")({
  data: Schema.Array(Album),
}) { }

export class SongResponse extends BaseResponse.extend<SongResponse>("SongResponse")({
  data: Schema.Array(Song),
}) { }

/**
 * The Apple Music search response model.
 * The API returns more keys here, but this class models
 * the supported search functionality only.
 *
 * See: https://developer.apple.com/documentation/applemusicapi/searchresponse
 */
export class AppleMusicSearchResponse extends Schema.Class<AppleMusicSearchResponse>("AppleMusicSearchResponse")({
  results: Schema.Struct({
    artists: ArtistResponse,
    albums: AlbumResponse,
    songs: SongResponse,
  }),
}) { }

/**
 * Query parameters for the Apple Music search request.
 *
 * See: https://developer.apple.com/documentation/applemusicapi/search-for-catalog-resources-(by-type)
 */
export class AppleMusicSearchRequestParams extends Schema.Class<AppleMusicSearchRequestParams>(
  "AppleMusicSearchRequestParams",
)({
  term: Schema.String,
  types: Schema.Array(Schema.Literal("albums", "artists", "songs")),
}) { }
