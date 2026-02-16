import { HttpApi } from "@effect/platform";
import { SearchGroup } from "./search-contract.js";

export class DomainApi extends HttpApi.make("DomainApi").add(SearchGroup).prefix("/v1") {}
