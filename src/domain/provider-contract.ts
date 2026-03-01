import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

export class ProviderGroup extends HttpApiGroup.make("provider").add(
  HttpApiEndpoint.get("providers", "/providers").addSuccess(Schema.Array(Schema.String)),
) { }
