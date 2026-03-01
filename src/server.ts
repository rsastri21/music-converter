import { FetchHttpClient, HttpApiBuilder, HttpMiddleware, HttpServer } from "@effect/platform";
import { DomainApi } from "./domain/domain-api.js";
import { Duration, Effect, Layer, Schedule } from "effect";
import { SearchLive } from "./api/search-live.js";
import { SpotifyAuthService } from "./providers/spotify/spotify-auth.js";
import { RedisService } from "./services/redis.js";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { createServer } from "node:http";
import { MusicServiceProviderMap } from "./providers/provider-map.js";
import { ProviderLive } from "./api/provider-live.js";

const ApiLive = HttpApiBuilder.api(DomainApi).pipe(Layer.provide([SearchLive, ProviderLive]));

const CorsLive = HttpApiBuilder.middlewareCors({
  allowedOrigins: ["*"],
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "B3", "traceparent"],
  credentials: true,
});

const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  HttpServer.withLogAddress,
  Layer.provide(CorsLive),
  Layer.provide(ApiLive),
  Layer.merge(Layer.effectDiscard(SpotifyAuthService.use((service) => service.setupCredentialsRefresh))),
  Layer.merge(Layer.effectDiscard(RedisService.use((redis) => redis.setupConnectionListeners))),
  Layer.provide(MusicServiceProviderMap.Default),
  Layer.provide(SpotifyAuthService.Default),
  Layer.provide(RedisService.Default),
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);

Layer.launch(HttpLive).pipe(
  Effect.tapErrorCause(Effect.logError),
  Effect.retry({
    while: (error) => error._tag === "RedisConnectionLostError",
    schedule: Schedule.exponential("1 second", 2).pipe(
      Schedule.modifyDelay(Duration.min("8 seconds")),
      Schedule.jittered,
      Schedule.repetitions,
      Schedule.modifyDelayEffect((count, delay) =>
        Effect.as(
          Effect.logError(`[Server crashed]: Retrying in ${Duration.format(delay)} (attempt #${count + 1})`),
          delay,
        ),
      ),
    ),
  }),
  NodeRuntime.runMain(),
);
