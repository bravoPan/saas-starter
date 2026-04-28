import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import NavBar from '@/app/components/navigation/NavBar';
import Footer from '@/app/components/Footer';
import { getAllPosts, getPost } from '../posts';

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

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </header>

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
      <Footer />
    </main>
  );
}
