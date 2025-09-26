import Link from "next/link";
import { Post } from "@/lib/posts";

interface RelatedPostsProps {
  posts: Post[];
  className?: string;
}

export default function RelatedPosts({ posts, className = "" }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;
  
  return (
    <section className={`bg-gray-50 dark:bg-gray-900/50 py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
          Related Articles
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-lg dark:hover:shadow-2xl"
            >
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{post.meta.city}</span>
                <span>•</span>
                <span>{post.meta.pillar}</span>
              </div>
              
              <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <Link href={`/blog/${post.slug}`}>
                  {post.meta.title}
                </Link>
              </h3>
              
              <p className="mb-4 text-gray-600 dark:text-gray-300 line-clamp-3">
                {post.meta.excerpt}
              </p>
              
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Read more
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}