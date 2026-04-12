/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as approvals from "../approvals.js";
import type * as calendar from "../calendar.js";
import type * as content from "../content.js";
import type * as execution from "../execution.js";
import type * as incidents from "../incidents.js";
import type * as memory from "../memory.js";
import type * as office from "../office.js";
import type * as overview from "../overview.js";
import type * as planning from "../planning.js";
import type * as presence from "../presence.js";
import type * as seed from "../seed.js";
import type * as stats from "../stats.js";
import type * as sync from "../sync.js";
import type * as tasks from "../tasks.js";
import type * as team from "../team.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  approvals: typeof approvals;
  calendar: typeof calendar;
  content: typeof content;
  execution: typeof execution;
  incidents: typeof incidents;
  memory: typeof memory;
  office: typeof office;
  overview: typeof overview;
  planning: typeof planning;
  presence: typeof presence;
  seed: typeof seed;
  stats: typeof stats;
  sync: typeof sync;
  tasks: typeof tasks;
  team: typeof team;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
