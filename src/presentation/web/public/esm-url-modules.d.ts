declare module "https://esm.sh/react@18.3.1" {
  import type * as ReactNamespace from "react";

  const React: typeof ReactNamespace;

  export default React;
  export const useEffect: typeof ReactNamespace.useEffect;
  export const useMemo: typeof ReactNamespace.useMemo;
  export const useRef: typeof ReactNamespace.useRef;
  export const useState: typeof ReactNamespace.useState;
}

declare module "https://esm.sh/react-dom@18.3.1/client" {
  export * from "react-dom/client";
}
