import Link from 'next/link';
import NavBar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';
import { getAllPosts } from './posts';

export const metadata = {
  title: 'Blog',
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="container py-16">
        <header className="mb-12 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Blog</h1>
          <p className="text-lg text-gray-600">
            Thoughts, tutorials, and updates. Replace this with your own content.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No posts yet. Add some in <code className="px-1.5 py-0.5 bg-gray-200 rounded text-sm">src/app/blog/posts.ts</code>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition"
              >
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
