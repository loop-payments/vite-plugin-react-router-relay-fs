import type { Plugin, ViteDevServer } from "vite";
import { readdir } from "fs/promises";
import { join, relative, sep as pathSeparator } from "path";
import { generate } from "astring";
import { generateRoutesFile } from "./file-generation/generate-routes-file.ts";
import { FileTree } from "./file-tree.ts";
import { removeEmptyNodes } from "./route-ast/remove-empty-nodes.ts";
import { compressRoutes } from "./route-ast/compress-routes.ts";
import { Program } from "estree";
import { fileTreeToDirectoryAst } from "./route-ast/file-tree-to-route-ast.ts";

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
      // Ignore irrelevant files
    } else if (isRoutableFile(entry.name)) {
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
        const tree = await scanDirectory(appDir, appDir);
        fileTrees[appName] = tree;
      }
    },

    async watchChange(
      id: string,
      { event }: { event: "create" | "update" | "delete" },
    ) {
      // Ignore update events, these don't require updating the file tree or
      // the generated routes file.
      if (event === "update") {
        return;
      }

      // Ignore changes to non-routable files
      if (!isRoutableFile(id)) {
        return;
      }

      const app = Object.entries(options.apps).find(([_, dir]) =>
        id.startsWith(dir),
      );
      if (app != null) {
        const [appName, appDir] = app;
        // Get the relative path from the app directory
        const parts = relative(appDir, id).split(pathSeparator);

        let current = fileTrees[appName];
        let madeChanges = false;

        switch (event) {
          case "create": {
            this.debug(`Adding ${id} to file tree`);

            // Walk the tree and create/update nodes
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (!(part in current) || current[part].kind !== "directory") {
                current[part] = {
                  kind: "directory",
                  path: join(appDir, ...parts.slice(0, i + 1)),
                  name: part,
                  id: join(...parts.slice(0, i + 1)),
                  children: {},
                };
                madeChanges = true;
              }
              current = current[part].children;
            }

            // Add the file node
            const fileName = parts.at(-1)!;
            if (current[fileName] == null) {
              current[fileName] = {
                kind: "file",
                path: id,
                name: fileName,
                id: join(...parts),
              };
              madeChanges = true;
            }
            break;
          }
          case "delete": {
            this.debug(`Removing ${id} from file tree`);

            // Walk the tree to find and remove the node
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (!(part in current) || current[part].kind !== "directory") {
                return; // Path not found
              }
              current = current[part].children;
            }

            const fileName = parts.at(-1)!;
            if (current[fileName] != null) {
              delete current[fileName];
              madeChanges = true;
            }
            break;
          }
        }

        // invalidate the route file
        if (madeChanges) {
          const module = server?.moduleGraph.getModuleById(
            `\0${VIRTUAL_MODULE_ID_PREFIX}${appName}`,
          );
          if (module != null) {
            server?.reloadModule(module);
          } else {
            this.error(`Virtual module not found for app ${appName}`);
          }
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

      this.debug(`Loading ${id}`);
      const appName = id.slice(RESOLVED_VIRTUAL_MODULE_ID_PREFIX.length);
      const fileTree = fileTrees[appName];
      if (!fileTree) {
        this.error(`File tree not found for app ${appName}`);
        return null;
      }

      const ast = fileTreeToDirectoryAst(fileTree);
      this.debug(() => JSON.stringify(ast, null, 2));

      const prunedAst = removeEmptyNodes(ast);
      let program: Program;
      if (prunedAst != null) {
        const compressedAst = compressRoutes(prunedAst);
        program = generateRoutesFile(compressedAst);
      } else {
        program = generateRoutesFile({
          kind: "directory",
          path: "",
          id: "",
          layout: null,
          index: null,
          children: [],
        });
      }
      const code = generate(program);

      // TODO: Remove
      this.debug(code);

      return {
        code,
        moduleSideEffects: false,
      };
    },
  };
}

/**
 * We only pay attention to files that will impact the route generation.
 * Specifically these are only entrypoints. In the future this may also include
 * a different "redirect" type of file.
 */
function isRoutableFile(id: string): boolean {
  return /\.entrypoint\.(t|j)sx?$/.test(id);
}
