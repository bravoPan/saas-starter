/**
 * Minimal in-file blog data source.
 *
 * This is intentionally simple: a typed object map you can edit directly. Good enough
 * for a starter / changelog. When you need real content management:
 *
 *   - File-based MDX: drop .mdx files in src/content/blog/ and read with @next/mdx
 *     or contentlayer.
 *   - DB-backed CMS: replace getAllPosts/getPost with Supabase queries; consider
 *     storing the body as MDX text and rendering server-side.
 *
 * Either path is straightforward because the rest of the app only depends on the
 * shape returned here.
 */

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  /** HTML string. Replace with MDX/Markdown when you scale up. */
  contentHtml: string;
};

const POSTS: BlogPost[] = [
  {
    slug: 'hello-world',
    title: 'Hello, world',
    description: 'A starter post to show how the blog scaffolding works.',
    date: 'Jan 1, 2026',
    readTime: '2 min read',
    contentHtml: `
      <p class="mb-4">
        This is the example post that ships with SaaS Starter. Edit
        <code>src/app/blog/posts.ts</code> to add more, or wire it up to your CMS of choice.
      </p>
      <h2 class="text-2xl font-bold mt-8 mb-4">Why this scaffold is intentionally minimal</h2>
      <p class="mb-4">
        Most starters either ship zero blog support (forcing you to integrate an MDX library
        on day one) or a full-blown CMS that's hard to rip out. We give you a working list
        page and detail page backed by a typed object — change one file, you're up.
      </p>
      <h2 class="text-2xl font-bold mt-8 mb-4">Upgrading later</h2>
      <p class="mb-4">
        When you outgrow this, the easiest path is MDX files in <code>src/content/blog/</code>.
        See the README for a sketch.
      </p>
    `,
  },
];

export function getAllPosts(): BlogPost[] {
  return POSTS;
}

export function getPost(slug: string): BlogPost | null {
  return POSTS.find((p) => p.slug === slug) ?? null;
}
