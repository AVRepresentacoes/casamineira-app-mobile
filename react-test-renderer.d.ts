declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  type ReactTestRendererJSON = {
    type: string;
    props: Record<string, unknown>;
    children: Array<ReactTestRendererJSON | string> | null;
  };

  type ReactTestRendererNode = ReactTestRendererJSON | string | null;

  export function create(element: ReactElement): {
    toJSON(): ReactTestRendererNode;
  };

  const renderer: {
    create: typeof create;
  };

  export default renderer;
}
