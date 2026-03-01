import { HttpApi } from "@effect/platform";
import { SearchGroup } from "./search-contract.js";
import { ProviderGroup } from "./provider-contract.js";

export class DomainApi extends HttpApi.make("DomainApi").add(SearchGroup).add(ProviderGroup).prefix("/v1") { }
