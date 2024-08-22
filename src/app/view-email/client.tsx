'use client';

import DOMPurify from 'dompurify';

interface Email {
  body: string;
}

export default function ViewFullEmailClient({ emailContent }: { emailContent: Email | null }) {

  return (
    <div className="break-words p-4">
      {/* Render the sanitized HTML content */}
      <div dangerouslySetInnerHTML={{ __html: emailContent?.body || "" }} />
    </div>
  );
}
