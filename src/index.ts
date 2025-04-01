import type { Plugin, ViteDevServer } from "vite";
import { readdir } from "fs/promises";
import { join, relative } from "path";
import { generate } from "astring";
import { generateRoutesFile } from "./file-generation/generate-routes-file.ts";
import { FileTree } from "./file-tree.ts";

type Options = {
  readonly apps: Record<string, string>;
};

const VIRTUAL_MODULE_ID_PREFIX = "virtual:react-router-relay-fs/";
const RESOLVED_VIRTUAL_MODULE_ID_PREFIX = `\0${VIRTUAL_MODULE_ID_PREFIX}`;

async function scanDirectory(dir: string, basePath: string): Promise<FileTree> {
  const tree: FileTree = {};
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const id = relative(basePath, fullPath);
    if (entry.isDirectory()) {
      tree[entry.name] = {
        kind: "directory",
        path: fullPath,
        name: entry.name,
        id,
        children: await scanDirectory(fullPath, basePath),
      };
      // Ignore non-js/ts files
    } else if (/\.(t|j)sx?$/.test(entry.name)) {
      tree[entry.name] = {
        kind: "file",
        path: fullPath,
        name: entry.name,
        id,
      };
    }
  }

  return tree;
}

export default function reactRouterRelayFs(options?: Options): Plugin {
  if (options?.apps == null || Object.keys(options.apps).length === 0) {
    throw new Error("apps option is required");
  }

  let fileTrees: Record<string, FileTree> = {};
  let server: ViteDevServer | undefined;

  return {
    name: "react-router-relay-fs",

    configureServer(s) {
      server = s;
    },

    async buildStart() {
      // Scan all directories and build initial file trees
      for (const [appName, appDir] of Object.entries(options.apps)) {
        this.addWatchFile(appDir);
        try {
          const tree = await scanDirectory(appDir, appDir);
          fileTrees[appName] = tree;
        } catch (error) {
          console.error(`Error scanning directory ${appDir}:`, error);
        }
      }
    },

    async watchChange(
      id: string,
      { event }: { event: "create" | "update" | "delete" }
    ) {
      console.log("watchChange", id, event);
      const app = Object.entries(options.apps).find(([_, dir]) =>
        id.startsWith(dir)
      );
      if (app != null) {
        const [appName, appDir] = app;
        switch (event) {
          case "create":
          case "delete":
            // Rescan the directory TODO: make this more efficient
            const tree = await scanDirectory(appDir, appDir);
            fileTrees[appName] = tree;
            // invalidate the route file
            const module = server?.moduleGraph.getModuleById(
              `\0${VIRTUAL_MODULE_ID_PREFIX}${appName}`
            );
            if (module != null) {
              server?.reloadModule(module);
            } else {
              console.log("Virtual module not found for app", `${appName}`);
            }
            break;
        }
      }
    },

    resolveId(id: string) {
      if (id.startsWith(VIRTUAL_MODULE_ID_PREFIX)) {
        return `\0${id}`;
      }
    },

    load(id: string) {
      if (!id.startsWith(RESOLVED_VIRTUAL_MODULE_ID_PREFIX)) {
        return null;
      }

      console.log(`Loading ${id}`);
      const appName = id.slice(RESOLVED_VIRTUAL_MODULE_ID_PREFIX.length);
      const fileTree = fileTrees[appName];
      if (!fileTree) {
        console.error(`File tree not found for app ${appName}`);
        return null;
      }

      const program = generateRoutesFile(fileTree);
      const code = generate(program);

      // TODO: Remove
      console.log(code);

      return {
        code,
        moduleSideEffects: false,
      };
    },
  };
}
