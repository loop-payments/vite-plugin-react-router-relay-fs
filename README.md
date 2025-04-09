# @loop-payments/vite-plugin-react-router-relay-fs

A vite plugin that will take care of generating @loop-payments/react-router-relay compatible routes objects from a directory tree of entrypoint files.

## Usage

Add the plugin to your vite config (e.g. `vite.config.mts`).

```ts
import reactRouterRelayFs from '@loop-payments/vite-plugin-react-router-relay-fs';
import react from '@vitejs/plugin-react';
import relay from 'vite-plugin-relay';

const config = {
  plugins: [
    react(),
    relay(),
    reactRouterRelayFs({
      apps: {
        // Each entry will generate a distinct routes object based on the
        // corresponding directory. Each route tree is importable via a virtual
        // import, ex: "virtual:react-router-relay-fs/myAppName".
        myAppName: path.resolve(__dirname, 'src/apps/someDirectory'),
      },
    }),
  ],
};

export default config;
```

In your code import the generated routes, preprocess them with @loop-payments/react-router-relay and then use them with a data router.

```tsx
import {
  type EntryPointRouteObject,
  preparePreloadableRoutes,
} from "@loop-payments/react-router-relay";
import { useMemo, useRef } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useRelayEnvironment } from "react-relay";
import MY_ROUTES from 'virtual:react-router-relay-fs/myAppName';

export default function MyRouter() {
  const environment = useRelayEnvironment();
  // Potentially unnecessary if you never change your environment
  const environmentRef = useRef(environment);
  environmentRef.current = environment;

  const router = useMemo(() => {
    const routes = preparePreloadableRoutes(MY_ROUTES, {
      getEnvironment() {
        return environmentRef.current;
      },
    });

    return createBrowserRouter(routes);
  }, []);

  return <RouterProvider router={router} />;
}
```

## File naming conventions

The file naming convention is based on [@react-router/fs-routes](https://reactrouter.com/how-to/file-route-conventions), but with some tweaks to use directories rather than a flat structure. This plugin does not treat `.` in file names as a path separator. Paths are based on the directory structure.

This plugin generates routes solely based on `.entrypoint.ts` files. This means you can put any files you desire in the routes directory, but only `.entrypoint.ts` files will be used to generate routes. This can be used to keep your components close to their respective entrypoints.

### Special file names

There are currently two reserved file names:

1. `_index.entrypoint.ts` This will define an index route for the current directory.
2. `_layout.entrypoint.ts` This will use the entrypoint as a parent "layout" component for everything in the current directory tree, including `_index.entrypoint.ts` (if present).

### Basic routes

The name of the file (except the `.entrypoint.ts` suffix) and the names of any parent directories will contribute to the path of the route. 

```
myAppRoutes/
├── _index.entrypoint.ts
├── about.entrypoint.ts
└── concerts
    └── trending.entrypoint.ts
```

| URL | Matched Route |
| - | - |
| `/` | `/myAppRoutes/_index.entrypoint.ts` |
| `/about` | `/myAppRoutes/about.entrypoint.ts` |
| `/concerts/trending` | `/myAppRoutes/concerts/trending.entrypoint.ts` |

### Dynamic segments

Dynamic segments are created via a `$` prefix.

```
myAppRoutes/
├── _index.entrypoint.ts
├── about.entrypoint.ts
└── concerts
    ├── $city.entrypoint.ts
    └── trending.entrypoint.ts
```

| URL | Matched Route |
| - | - |
| `/` | `/myAppRoutes/_index.entrypoint.ts` |
| `/about` | `/myAppRoutes/about.entrypoint.ts` |
| `/concerts/salt-lake-city` | `/myAppRoutes/concerts/$city.entrypoint.ts` |
| `/concerts/san-diego` | `/myAppRoutes/concerts/$city.entrypoint.ts` |
| `/concerts/trending` | `/myAppRoutes/concerts/trending.entrypoint.ts` |

### Nested routes

This differs from [@react-router/fs-routes](https://reactrouter.com/how-to/file-route-conventions#nested-routes) because we use directories. Nested routes are created via `_layout.entrypoint.ts` entries in the directory, all routes in the directory will be nested inside of the given layout.

```
myAppRoutes/
├── _index.entrypoint.ts
├── about.entrypoint.ts
└── concerts
    ├── _layout.entrypoint.ts
    ├── $city.entrypoint.ts
    └── trending.entrypoint.ts
```

| URL | Matched Route | Layout |
| - | - | - |
| `/` | `/myAppRoutes/_index.entrypoint.ts` | none |
| `/about` | `/myAppRoutes/about.entrypoint.ts` | none |
| `/concerts/salt-lake-city` | `/myAppRoutes/concerts/$city.entrypoint.ts` | `/myAppRoutes/concerts/_layout.entrypoint.ts` |
| `/concerts/san-diego` | `/myAppRoutes/concerts/$city.entrypoint.ts` | `/myAppRoutes/concerts/_layout.entrypoint.ts` |
| `/concerts/trending` | `/myAppRoutes/concerts/trending.entrypoint.ts` | `/myAppRoutes/concerts/_layout.entrypoint.ts` |

### Nested layouts without nested URLs

You can create pathless routes using an `_` prefix. This is the same convention as [@react-router/fs-routes](https://reactrouter.com/how-to/file-route-conventions#nested-layouts-without-nested-urls).


```
myAppRoutes/
├── _auth
|   ├── _layout.entrypoint.ts
|   ├── login.entrypoint.ts
|   └── register.entrypoint.ts
├── _index.entrypoint.ts
├── about.entrypoint.ts
└── concerts
    ├── _layout.entrypoint.ts
    ├── $city.entrypoint.ts
    └── trending.entrypoint.ts
```

| URL | Matched Route | Layout |
| - | - | - |
| `/` | `/myAppRoutes/_index.entrypoint.ts` | none |
| `/about` | `/myAppRoutes/about.entrypoint.ts` | none |
| `/login` | `/myAppRoutes/_auth/login.entrypoint.ts` | `/myAppRoutes/_auth/_layout.entrypoint.ts` |
| `/register` | `/myAppRoutes/_auth/register.entrypoint.ts` | `/myAppRoutes/_auth/_layout.entrypoint.ts` |
| `/concerts/salt-lake-city` | `/myAppRoutes/concerts/$city.entrypoint.ts` | `/myAppRoutes/concerts/_layout.entrypoint.ts` |
| `/concerts/san-diego` | `/myAppRoutes/concerts/$city.entrypoint.ts` | `/myAppRoutes/concerts/_layout.entrypoint.ts` |
| `/concerts/trending` | `/myAppRoutes/concerts/trending.entrypoint.ts` | `/myAppRoutes/concerts/_layout.entrypoint.ts` |

### Optional segments

Wrapping a segment with parentheses will make the segment optional. This is the same convention as [@react-router/fs-routes](https://reactrouter.com/how-to/file-route-conventions#optional-segments).

```
myAppRoutes/
└── ($lang)
    ├── _index.entrypoint.ts
    ├── $productId.entrypoint.ts
    └── categories.entrypoint.ts
```

| URL | Matched Route |
| - | - |
| `/` | `/myAppRoutes/($lang)/_index.entrypoint.ts` |
| `/categories` | `/myAppRoutes/($lang)/categories.entrypoint.ts` |
| `/en/categories` | `/myAppRoutes/($lang)/categories.entrypoint.ts` |
| `/fr/categories` | `/myAppRoutes/($lang)/categories.entrypoint.ts` |
| `/american-flag-speedo` | `/myAppRoutes/($lang)/_index.entrypoint.ts` |
| `/en/american-flag-speedo` | `/myAppRoutes/($lang)/$productId.entrypoint.ts` |
| `/fr/american-flag-speedo` | `/myAppRoutes/($lang)/$productId.entrypoint.ts` |

See the note in React Router's docs about dynamic params following optional segments for more details on why `/american-flag-speedo` will match `_index.entrypoint.ts`.

### Spat routes

Splat routes, that match the rest of the url (including slashes), can be defined as `$.entrypoint.ts`. This is the same convention as [@react-router/fs-routes](https://reactrouter.com/how-to/file-route-conventions#splat-routes)

```
myAppRoutes/
├── _index.entrypoint.ts
├── $.entrypoint.ts
├── about.entrypoint.ts
└── files
    └── $.entrypoint.ts
```

| URL | Matched Route |
| - | - |
| `/` | `/myAppRoutes/_index.entrypoint.ts` |
| `/about` | `/myAppRoutes/about.entrypoint.ts` |
| `/beef/and/cheese` | `/myAppRoutes/$.entrypoint.ts` |
| `/files` | `/myAppRoutes/files/$.entrypoint.ts` |
| `/files/talks/react-conf_old.pdf` | `/myAppRoutes/files/$.entrypoint.ts` |
| `/files/talks/react-conf_final.pdf` | `/myAppRoutes/files/$.entrypoint.ts` |
| `/files/talks/react-conf-FINAL-MAY_2024.pdf` | `/myAppRoutes/files/$.entrypoint.ts` |
