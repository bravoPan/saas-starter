import Link from 'next/link';
import type { ComponentProps } from 'react';
import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

/**
 * Custom MDX element overrides. Pass to <MDXRemote components={MDX_COMPONENTS} />.
 *
 * Two things going on here:
 *   - Internal links (relative or starting with `/`) become `next/link` for client-side nav.
 *   - Pre/code blocks get our colorway. (Syntax highlighting is applied by
 *     rehype-pretty-code at the rehype stage; we only add layout chrome here.)
 */
export const MDX_COMPONENTS: MDXRemoteProps['components'] = {
  a: ({ href, children, ...rest }: ComponentProps<'a'>) => {
    const isInternal =
      typeof href === 'string' && (href.startsWith('/') || href.startsWith('#'));
    if (isInternal) {
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  },
};
