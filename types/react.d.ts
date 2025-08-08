// React 19 compatibility with Next.js 15
declare module 'react' {
  interface ReactPortal {
    children?: ReactNode;
  }
}