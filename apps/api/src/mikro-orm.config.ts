import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { getDatabaseUrl } from "./utils/env.js";
import { ReflectMetadataProvider } from "@mikro-orm/decorators/legacy";

export default defineConfig({
  clientUrl: getDatabaseUrl(),

  entities: ["./dist/entities/*.js"],
  entitiesTs: ["./src/entities/*.ts"],

  extensions: [Migrator],
  metadataProvider: ReflectMetadataProvider,

  migrations: {
    path: "./dist/migrations",
    pathTs: "./src/migrations",
    glob: "!(*.d).{js,ts}",
  },

  debug: process.env.NODE_ENV !== "production",
});
