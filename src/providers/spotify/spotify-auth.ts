import { HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import { Config, Data, Effect, pipe, Redacted, Schedule, Schema } from "effect";
import { SPOTIFY_AUTH_URL } from "src/providers/spotify/models/models.js";
import { RedisService } from "../../services/redis.js";

const REFRESH_INTERVAL = "30 minutes";
const CREDENTIALS_KEY = "spotify-auth-credentials";
const SPOTIFY_AUTH_REQUEST_BODY = new URLSearchParams({
  grant_type: "client_credentials",
});

class SpotifyAuthError extends Data.TaggedError("SpotifyAuthError")<{
  message: string;
  cause: Error;
}> { }

class SpotifyToken extends Schema.Class<SpotifyToken>("SpotifyToken")({
  accessToken: Schema.propertySignature(Schema.String).pipe(Schema.fromKey("access_token")),
  tokenType: Schema.propertySignature(Schema.Literal("Bearer")).pipe(Schema.fromKey("token_type")),
  expiresIn: Schema.propertySignature(Schema.Union(Schema.Number, Schema.String)).pipe(Schema.fromKey("expires_in")),
}) { }

export class SpotifyAuthService extends Effect.Service<SpotifyAuthService>()(
  "music-converter/services/spotify-auth/SpotifyAuthService",
  {
    dependencies: [RedisService.Default],
    effect: Effect.gen(function*() {
      const clientId = yield* Config.redacted("SPOTIFY_CLIENT_ID");
      const clientSecret = yield* Config.redacted("SPOTIFY_CLIENT_SECRET");
      const client = yield* HttpClient.HttpClient;
      const redis = yield* RedisService;

      const authHeader =
        "Basic " + Buffer.from(`${Redacted.value(clientId)}:${Redacted.value(clientSecret)}`).toString("base64");

      const authRequest = HttpClientRequest.post(SPOTIFY_AUTH_URL).pipe(
        HttpClientRequest.setHeader("Authorization", authHeader),
        HttpClientRequest.setHeader("Content-Type", "application/x-www-form-urlencoded"),
        HttpClientRequest.bodyUrlParams(SPOTIFY_AUTH_REQUEST_BODY),
      );

      const setupCredentialsRefresh = Effect.zipRight(
        Effect.gen(function*() {
          const authResponse = yield* client.execute(authRequest);
          const auth = yield* HttpClientResponse.schemaBodyJson(SpotifyToken)(authResponse);
          yield* redis.execute((client) => client.hSet(CREDENTIALS_KEY, Schema.encodeSync(SpotifyToken)(auth)));
        }),
        Effect.logInfo(`[Spotify Credentials]: Cached credentials. Refreshing in ${REFRESH_INTERVAL}.`),
      ).pipe(
        Effect.catchTag("ParseError", (e) =>
          Effect.fail(new SpotifyAuthError({ message: "Invalid credentials response.", cause: e })),
        ),
        Effect.catchAll(Effect.die),
        Effect.repeat(Schedule.spaced(REFRESH_INTERVAL)),
      );

      const retrieve = Effect.fn("SpotifyAuthService.retrieve")(
        function*() {
          return yield* redis.execute((client) => client.hGetAll(CREDENTIALS_KEY));
        },
        (effect) =>
          pipe(
            effect,
            Effect.flatMap(Schema.decodeUnknown(SpotifyToken)),
            Effect.flatMap((response) => Effect.succeed(response.accessToken)),
            Effect.catchTags({
              RedisError: Effect.die,
              ParseError: Effect.die,
            }),
          ),
      );

      return {
        retrieve,
        setupCredentialsRefresh,
      } as const;
    }),
  },
) { }
