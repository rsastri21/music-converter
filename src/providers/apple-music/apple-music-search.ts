import { Effect, identity, Layer, pipe } from "effect";
import type { MusicServiceProviderShape } from "src/domain/provider-shape.js";
import { MusicServiceProvider } from "src/domain/provider-shape.js";
import { AppleMusicAuthService } from "./apple-music-auth.js";
import { HttpClient, HttpClientRequest, HttpClientResponse, UrlParams } from "@effect/platform";
import { APPLE_MUSIC_BASE_URL, APPLE_MUSIC_SEARCH_URL } from "./models/models.js";
import {
  AlbumResponse,
  ArtistResponse,
  AppleMusicGetError,
  AppleMusicSearchError,
  AppleMusicSearchResponse,
  SongResponse,
} from "./models/api-contract.js";
import { albumToDao, artistToDao, songToDao } from "./mapper.js";

type AppleMusicType = "track" | "artist" | "album";
type AppleMusicGetResponse = typeof SongResponse.Type | typeof ArtistResponse.Type | typeof AlbumResponse.Type;

function isAppleMusicType(type: string): type is AppleMusicType {
  return type === "track" || type === "artist" || type === "album";
}

const guardNonNullResponse = Effect.fnUntraced(function*(response: AppleMusicGetResponse) {
  yield* Effect.fail(new AppleMusicGetError({ message: "Empty response." })).pipe(
    Effect.when(() => response.data.length == 0),
  );
});

export const appleMusicSearchLayer = Layer.effect(
  MusicServiceProvider,
  Effect.gen(function*() {
    const appleMusicAuth = yield* AppleMusicAuthService;
    const client = yield* HttpClient.HttpClient;

    return identity<MusicServiceProviderShape>({
      providerId: "appleMusic",
      search: Effect.fn("AppleMusicSearch.search")(
        function*(query: string) {
          const token = yield* appleMusicAuth.retrieve();
          const searchParams = UrlParams.fromInput({
            term: query,
          });
          const req = HttpClientRequest.get(APPLE_MUSIC_SEARCH_URL).pipe(
            HttpClientRequest.setUrlParams(searchParams),
            HttpClientRequest.bearerToken(token),
          );
          const res = yield* client.execute(req);
          const searchResponse = yield* HttpClientResponse.schemaBodyJson(AppleMusicSearchResponse)(res);
          return {
            tracks: searchResponse.results.songs?.data.map(songToDao) ?? [],
            artists: searchResponse.results.artists?.data.map(artistToDao) ?? [],
            albums: searchResponse.results.albums?.data.map(albumToDao) ?? [],
          };
        },
        (effect) =>
          pipe(
            effect,
            Effect.catchTag("ParseError", (e) =>
              Effect.die(new AppleMusicSearchError({ message: "Failed to parse search response.", cause: e })),
            ),
            Effect.catchAll(Effect.die),
          ),
      ),
      get: Effect.fn("AppleMusicSearch.get")(
        function*(type: string, id: string) {
          yield* Effect.fail(new AppleMusicGetError({ message: "Invalid type for get request." })).pipe(
            Effect.when(() => !isAppleMusicType(type)),
          );

          if (!isAppleMusicType(type)) {
            throw new Error("Invalid type. Unreachable due to effect guard above");
          }

          const token = yield* appleMusicAuth.retrieve();

          switch (type) {
            case "track": {
              const req = HttpClientRequest.get(`${APPLE_MUSIC_BASE_URL}/songs/${id}`).pipe(
                HttpClientRequest.bearerToken(token),
              );
              const res = yield* client.execute(req);
              const songResponse = yield* HttpClientResponse.schemaBodyJson(SongResponse)(res);
              yield* guardNonNullResponse(songResponse);
              return songToDao(songResponse.data[0]);
            }
            case "artist": {
              const req = HttpClientRequest.get(`${APPLE_MUSIC_BASE_URL}/songs/${id}`).pipe(
                HttpClientRequest.bearerToken(token),
              );
              const res = yield* client.execute(req);
              const artistResponse = yield* HttpClientResponse.schemaBodyJson(ArtistResponse)(res);
              yield* guardNonNullResponse(artistResponse);
              return artistToDao(artistResponse.data[0]);
            }
            case "album": {
              const req = HttpClientRequest.get(`${APPLE_MUSIC_BASE_URL}/songs/${id}`).pipe(
                HttpClientRequest.bearerToken(token),
              );
              const res = yield* client.execute(req);
              const albumResponse = yield* HttpClientResponse.schemaBodyJson(AlbumResponse)(res);
              yield* guardNonNullResponse(albumResponse);
              return albumToDao(albumResponse.data[0]);
            }
          }
        },
        (effect) =>
          pipe(
            effect,
            Effect.catchTag("ParseError", (e) =>
              Effect.die(new AppleMusicGetError({ message: "Failed to parse response.", cause: e })),
            ),
            Effect.catchAll(Effect.die),
          ),
      ),
    });
  }),
);
