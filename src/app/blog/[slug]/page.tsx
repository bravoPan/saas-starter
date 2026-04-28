import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import type { Pluggable } from 'unified';
import { FiArrowLeft } from 'react-icons/fi';
import NavBar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';
import Paywall from '@/app/components/access/Paywall';
import { TIER_ICON, TIER_LABEL } from '@/app/lib/plans';
import { getAllPosts, getPost, isPaywalled } from '../posts';
import { MDX_COMPONENTS } from '../mdx-components';

type Params = { slug: string };

export function generateStaticParams() {
  return getAllPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Post not found' };
  return { title: post.title, description: post.description };
}

// `as Pluggable[]` is needed because TS infers the inner [plugin, options]
// as a flat array rather than a tuple, which Pluggable requires.
const REHYPE_PLUGINS: Pluggable[] = [
  [rehypePrettyCode, { theme: 'github-dark-dimmed', keepBackground: true }],
];

const MDX_OPTIONS = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: REHYPE_PLUGINS,
  },
};

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // Body rendering strategy:
  //   - Public posts (no `tier` or tier=free) → render the whole body inline.
  //   - Paywalled posts → split the MDX at the first blank line. The first
  //     paragraph becomes the public preview, the rest is wrapped in <Paywall>.
  //
  // Authors who want a custom split point can drop "<!-- preview-end -->" in
  // the MDX; we honor it as a higher-priority delimiter.
  const { preview, locked } = splitForPaywall(post.mdx);
  const paywalled = isPaywalled(post);

  return (
    <main className="min-h-screen">
      <NavBar />
      <article className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-primary hover:underline mb-8"
        >
          <FiArrowLeft className="mr-2" />
          Back to all posts
        </Link>

        <header className="mb-10">
          {post.tier && post.tier !== 'free' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100 mb-3">
              {TIER_ICON[post.tier]} {TIER_LABEL[post.tier]} members
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{post.title}</h1>
          <p className="text-lg text-gray-600 mb-3">{post.description}</p>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.readTime && (
              <>
                <span>·</span>
                <span>{post.readTime}</span>
              </>
            )}
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          {paywalled ? (
            <Paywall
              tier={post.tier!}
              preview={<MDXRemote source={preview} options={MDX_OPTIONS} components={MDX_COMPONENTS} />}
            >
              <MDXRemote source={locked} options={MDX_OPTIONS} components={MDX_COMPONENTS} />
            </Paywall>
          ) : (
            <MDXRemote source={post.mdx} options={MDX_OPTIONS} components={MDX_COMPONENTS} />
          )}
        </div>
      </article>
      <Footer />
    </main>
  );
}

const PREVIEW_DELIMITER = '<!-- preview-end -->';

/**
 * Split MDX into a (public preview, locked body) pair.
 *
 * Priority:
 *   1. An explicit `<!-- preview-end -->` HTML comment author-placed.
 *   2. Otherwise, the first blank-line-separated block is the preview.
 *      (Authors who want more in the preview should add the delimiter.)
 */
function splitForPaywall(mdx: string): { preview: string; locked: string } {
  const explicitIdx = mdx.indexOf(PREVIEW_DELIMITER);
  if (explicitIdx !== -1) {
    return {
      preview: mdx.slice(0, explicitIdx).trim(),
      locked: mdx.slice(explicitIdx + PREVIEW_DELIMITER.length).trim(),
    };
  }

  const blankLineIdx = mdx.search(/\n\s*\n/);
  if (blankLineIdx === -1) {
    return { preview: mdx, locked: '' };
  }
  return {
    preview: mdx.slice(0, blankLineIdx).trim(),
    locked: mdx.slice(blankLineIdx).trim(),
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
