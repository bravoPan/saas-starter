import Link from 'next/link';
import { FiBookOpen, FiArrowRight } from 'react-icons/fi';
import NavBar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';
import { getAllPosts } from './posts';
import { TIER_ICON, TIER_LABEL } from '@/app/lib/plans';

export const metadata = {
  title: 'Blog',
};

const WRITING_GUIDE_SLUG = 'writing-guide';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BlogIndexPage() {
  const allPosts = getAllPosts();
  const hasGuide = allPosts.some((p) => p.slug === WRITING_GUIDE_SLUG);
  // Surface the writing guide separately as a CTA card, not in the post list.
  const posts = allPosts.filter((p) => p.slug !== WRITING_GUIDE_SLUG);

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="container py-16">
        <header className="mb-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Blog</h1>
          <p className="text-lg text-gray-600">
            MDX-powered. Drop <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">.mdx</code>{' '}
            files into <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">src/content/blog/</code>{' '}
            and they appear here.
          </p>
        </header>

        {hasGuide && (
          <Link
            href={`/blog/${WRITING_GUIDE_SLUG}`}
            className="group flex items-start gap-4 p-5 mb-10 rounded-xl border border-primary-100 bg-primary-50/60 hover:bg-primary-50 hover:border-primary-200 transition"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
              <FiBookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium uppercase tracking-wide text-primary-700">
                  New here?
                </span>
              </div>
              <h2 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                Writing posts — the MDX guide
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Frontmatter fields, code highlighting, tier-gating, custom components, and the
                migration path to a Supabase CMS.
              </p>
            </div>
            <FiArrowRight className="self-center shrink-0 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
          </Link>
        )}

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">
              No posts yet. Add some in{' '}
              <code className="px-1.5 py-0.5 bg-gray-200 rounded text-sm">src/content/blog/</code>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => {
              const isPaid = post.tier && post.tier !== 'free';
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition"
                >
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="text-xs text-gray-500">{formatDate(post.date)}</span>
                    {post.readTime && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{post.readTime}</span>
                      </>
                    )}
                    {isPaid && (
                      <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
                        {TIER_ICON[post.tier!]} {TIER_LABEL[post.tier!]}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
