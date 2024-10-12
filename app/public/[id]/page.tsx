import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { Database } from "@/database.types";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export default async function PublicDocument({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Fetch the document
  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .eq("is_public", true)
    .single();

  if (error || !document) {
    console.error("Error fetching document:", error);
    notFound();
  }

  if (!document.is_public) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-4'>Access Denied</h1>
        <p>This document is not public or does not exist.</p>
      </div>
    );
  }

  // Sanitize the HTML content
  const sanitizedContent = DOMPurify.sanitize(document?.content || "");

  return (
    <div className='bg-gray-100 min-h-screen'>
      <div className='max-w-5xl mx-auto px-4 py-12'>
        <article className='bg-white shadow-lg rounded-lg overflow-hidden'>
          <div className='px-6 py-8'>
            <h1 className='text-4xl font-bold mb-4 text-gray-900'>
              {document.title}
            </h1>
            <div className='mb-6'>
              <span className='text-sm text-gray-500'>
                Published on{" "}
                {new Date(document.created_at).toLocaleDateString()}
              </span>
            </div>
            <div
              className='prose prose-lg max-w-none text-gray-700'
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: document } = await supabase
    .from("documents")
    .select("title")
    .eq("id", params.id)
    .eq("is_public", true)
    .single();

  return {
    title: document?.title || "Public Document",
    description: "View this public document",
  };
}
