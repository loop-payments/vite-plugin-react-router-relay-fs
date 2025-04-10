export type RouteNode = LeafNode | DirectoryNode;

export type LeafLikeNode = LeafNode | IndexLeafNode | LayoutNode;

export type LeafNode = {
  kind: "leaf";
  id: string;
  path: string;
  entryPointFilePath: string;
};

export type IndexLeafNode = {
  kind: "index";
  id: string;
  entrypointFilePath: string;
};

export type LayoutNode = {
  kind: "layout";
  id: string;
  entrypointFilePath: string;
};

export type DirectoryNode = {
  kind: "directory";
  id: string;
  path: string | undefined;
  layout: LayoutNode | null;
  index: IndexLeafNode | null;
  children: Array<RouteNode>;
};
