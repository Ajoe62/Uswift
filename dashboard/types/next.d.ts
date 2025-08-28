// Temporary type declarations for Next.js modules
declare module "next/navigation" {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}

declare module "next/image" {
  import { ComponentProps } from "react";
  const Image: React.ComponentType<
    ComponentProps<"img"> & {
      src: string;
      alt: string;
      width?: number;
      height?: number;
      fill?: boolean;
      priority?: boolean;
    }
  >;
  export default Image;
}

declare module "next/server" {
  export class NextRequest extends Request {
    nextUrl: {
      pathname: string;
      searchParams: URLSearchParams;
    };
  }

  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL): NextResponse;
    static next(): NextResponse;
  }
}
