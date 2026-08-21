/// <reference types="vite/client" />

declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.module.scss?url' {
  const url: string;
  export default url;
}

declare module '*.module.scss?inline' {
  const css: string;
  export default css;
}
