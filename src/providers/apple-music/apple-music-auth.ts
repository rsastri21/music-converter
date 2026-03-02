import { Config, Data, Effect, pipe, Redacted, Schedule, Schema } from "effect";
import { RedisService } from "src/services/redis.js";
import jwt from "jsonwebtoken";

const REFRESH_INTERVAL = "1 hour";
const CREDENTIALS_KEY = "apple-music-auth-credentials";

class AppleMusicAuthError extends Data.TaggedError("AppleMusicAuthError")<{
  message: string;
  cause: unknown;
}> { }

class AppleMusicToken extends Schema.Class<AppleMusicToken>("AppleMusicToken")({
  token: Schema.String,
}) { }

export class AppleMusicAuthService extends Effect.Service<AppleMusicAuthService>()(
  "music-converter/providers/apple-music/apple-music-auth/AppleMusicAuthService",
  {
    dependencies: [RedisService.Default],
    effect: Effect.gen(function*() {
      const appleMusicKeyId = yield* Config.redacted("APPLE_MUSIC_KEY_ID");
      const appleTeamId = yield* Config.redacted("APPLE_TEAM_ID");
      const appleMusicSecret = yield* Config.redacted("APPLE_MUSIC_SECRET");
      const redis = yield* RedisService;

      const privateKey = yield* Effect.try({
        try: () => Buffer.from(Redacted.value(appleMusicSecret), "base64").toString("utf-8"),
        catch: (error) => new AppleMusicAuthError({ message: "Could not decode private key", cause: error }),
      });

      const generateToken = Effect.gen(function*() {
        const token = yield* Effect.try({
          try: () => {
            const nowInSeconds = Math.floor(Date.now() / 1000);

            return jwt.sign(
              {
                iss: Redacted.value(appleTeamId),
                iat: nowInSeconds,
                exp: nowInSeconds + 60 * 60 * 2,
              },
              privateKey,
              {
                algorithm: "ES256",
                header: {
                  alg: "ES256",
                  kid: Redacted.value(appleMusicKeyId),
                },
              },
            );
          },
          catch: (error) => new AppleMusicAuthError({ message: "Could not sign JWT", cause: error }),
        });

        return token;
      });

      const setupCredentialsRefresh = Effect.zipRight(
        Effect.gen(function*() {
          const token = yield* generateToken;
          const payload = yield* Schema.encode(AppleMusicToken)({ token });
          return yield* redis.execute((client) => client.hSet(CREDENTIALS_KEY, payload));
        }),
        Effect.logInfo(`[Apple Music Credentials]: Cached credentials. Refreshing in ${REFRESH_INTERVAL}.`),
      ).pipe(
        Effect.catchTag("ParseError", (e) =>
          Effect.fail(new AppleMusicAuthError({ message: "Invalid credentials encoding.", cause: e })),
        ),
        Effect.catchAll(Effect.die),
        Effect.repeat(Schedule.spaced(REFRESH_INTERVAL)),
      );

      const retrieve = Effect.fn("AppleMusicAuthService.retrieve")(
        function*() {
          return yield* redis.execute((client) => client.hGetAll(CREDENTIALS_KEY));
        },
        (effect) =>
          pipe(
            effect,
            Effect.flatMap(Schema.decodeUnknown(AppleMusicToken)),
            Effect.flatMap((response) => Effect.succeed(response.token)),
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
