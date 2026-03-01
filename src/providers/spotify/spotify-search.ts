import { Effect, identity, Layer, pipe } from "effect";
import { MusicServiceProvider, type MusicServiceProviderShape } from "src/domain/provider-shape.js";
import { SpotifyAuthService } from "./spotify-auth.js";
import { HttpClient, HttpClientRequest, HttpClientResponse, UrlParams } from "@effect/platform";
import { SpotifyGetError, SpotifySearchError, SpotifySearchResponse } from "./models/api-contract.js";
import { Album, Artist, SPOTIFY_BASE_URL, SPOTIFY_SEARCH_URL, Track } from "./models/models.js";
import { albumToDao, artistToDao, trackToDao } from "./mapper.js";

type SpotifyType = "track" | "artist" | "album";

function isSpotifyType(type: string): type is SpotifyType {
  return type === "track" || type === "artist" || type === "album";
}

export const spotifySearchLayer = Layer.effect(
  MusicServiceProvider,
  Effect.gen(function*() {
    const spotifyAuth = yield* SpotifyAuthService;
    const client = yield* HttpClient.HttpClient;

    return identity<MusicServiceProviderShape>({
      providerId: "spotify",
      search: Effect.fn("SpotifySearch.search")(
        function*(query: string) {
          const token = yield* spotifyAuth.retrieve();
          const searchParams = UrlParams.fromInput({
            q: query,
            type: ["track,album,artist"],
            market: "US",
          });
          const req = HttpClientRequest.get(SPOTIFY_SEARCH_URL).pipe(
            HttpClientRequest.setUrlParams(searchParams),
            HttpClientRequest.bearerToken(token),
          );
          const res = yield* client.execute(req);
          const searchResponse = yield* HttpClientResponse.schemaBodyJson(SpotifySearchResponse)(res);
          return {
            tracks: searchResponse.tracks.items.map(trackToDao),
            artists: searchResponse.artists.items.map(artistToDao),
            albums: searchResponse.albums.items.map(albumToDao),
          };
        },
        (effect) =>
          pipe(
            effect,
            Effect.catchTag("ParseError", (e) =>
              Effect.die(new SpotifySearchError({ message: "Failed to parse response.", cause: e })),
            ),
            Effect.catchAll(Effect.die),
          ),
      ),
      get: Effect.fn("SpotifySearch.get")(
        function*(type: string, id: string) {
          yield* Effect.fail(new SpotifyGetError({ message: "Invalid type for get request." })).pipe(
            Effect.when(() => !isSpotifyType(type)),
          );

          if (!isSpotifyType(type)) {
            throw new Error("Invalid type. Unreachable due to effect guard above");
          }

          const token = yield* spotifyAuth.retrieve();
          const searchParams = UrlParams.fromInput({
            market: "US",
          });

          switch (type) {
            case "track": {
              const req = HttpClientRequest.get(`${SPOTIFY_BASE_URL}/tracks/${id}`).pipe(
                HttpClientRequest.setUrlParams(searchParams),
                HttpClientRequest.bearerToken(token),
              );
              const res = yield* client.execute(req);
              const track = yield* HttpClientResponse.schemaBodyJson(Track)(res);
              return trackToDao(track);
            }
            case "artist": {
              const req = HttpClientRequest.get(`${SPOTIFY_BASE_URL}/artists/${id}`).pipe(
                HttpClientRequest.setUrlParams(searchParams),
                HttpClientRequest.bearerToken(token),
              );
              const res = yield* client.execute(req);
              const artist = yield* HttpClientResponse.schemaBodyJson(Artist)(res);
              return artistToDao(artist);
            }
            case "album": {
              const req = HttpClientRequest.get(`${SPOTIFY_BASE_URL}/albums/${id}`).pipe(
                HttpClientRequest.setUrlParams(searchParams),
                HttpClientRequest.bearerToken(token),
              );
              const res = yield* client.execute(req);
              const album = yield* HttpClientResponse.schemaBodyJson(Album)(res);
              return albumToDao(album);
            }
          }
        },
        (effect) =>
          pipe(
            effect,
            Effect.catchTag("ParseError", (e) =>
              Effect.die(new SpotifyGetError({ message: "Failed to parse response.", cause: e })),
            ),
            Effect.catchAll(Effect.die),
          ),
      ),
    });
  }),
);
