import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { isTier, type Tier } from '@/app/lib/plans';

/**
 * File-based MDX blog source.
 *
 * Drop `.mdx` files into `src/content/blog/`. Each file's slug = its filename
 * without the `.mdx` extension. Frontmatter is parsed with gray-matter.
 *
 * To migrate to a DB-backed CMS later: swap the implementations of
 * `getAllPosts()` and `getPost()` for Supabase queries that return the same
 * `BlogPost` shape. The pages don't import this module's internals.
 */

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  readTime?: string;
  /** Optional access tier. Omit (or set to 'free') for fully public posts. */
  tier?: Tier;
};

export type BlogPost = BlogFrontmatter & {
  slug: string;
  /** Raw MDX source. Pages compile + render with <MDXRemote source={mdx} />. */
  mdx: string;
};

function listMdxFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.mdx'));
}

function parseFile(filename: string): BlogPost {
  const filePath = path.join(CONTENT_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  if (typeof data.title !== 'string') {
    throw new Error(`[blog] ${filename}: missing required string \`title\` in frontmatter`);
  }
  if (typeof data.description !== 'string') {
    throw new Error(`[blog] ${filename}: missing required string \`description\` in frontmatter`);
  }
  if (data.date == null) {
    throw new Error(`[blog] ${filename}: missing required \`date\` in frontmatter`);
  }
  if (data.tier !== undefined && !isTier(data.tier)) {
    throw new Error(
      `[blog] ${filename}: \`tier\` must be one of free|basic|pro|enterprise (got: ${JSON.stringify(data.tier)})`
    );
  }

  // gray-matter may give us a Date object; serialize for client safety.
  const date =
    data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date);

  return {
    slug: filename.replace(/\.mdx$/, ''),
    title: data.title,
    description: data.description,
    date,
    readTime: typeof data.readTime === 'string' ? data.readTime : undefined,
    tier: data.tier as Tier | undefined,
    mdx: content,
  };
}

export function getAllPosts(): BlogPost[] {
  return listMdxFiles()
    .map(parseFile)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPost(slug: string): BlogPost | null {
  const filename = `${slug}.mdx`;
  const filePath = path.join(CONTENT_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return parseFile(filename);
}

/** Returns true if a post should be soft-paywalled (gated, with a preview). */
export function isPaywalled(post: BlogPost): boolean {
  return post.tier !== undefined && post.tier !== 'free';
}
