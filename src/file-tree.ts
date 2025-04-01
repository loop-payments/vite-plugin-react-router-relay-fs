export type FileNode = {
  kind: "file";
  path: string;
  name: string;
  id: string;
};

export type DirectoryNode = {
  kind: "directory";
  path: string;
  name: string;
  id: string;
  children: FileTree;
};

export type FileTree = {
  [key: string]: FileNode | DirectoryNode;
};
