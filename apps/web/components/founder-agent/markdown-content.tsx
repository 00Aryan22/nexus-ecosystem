"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h3 className="font-heading font-bold text-base text-foreground mt-3 mb-2">
            {children}
          </h3>
        ),
        h2: ({ children }) => (
          <h4 className="font-heading font-bold text-sm text-foreground mt-2.5 mb-1.5">
            {children}
          </h4>
        ),
        h3: ({ children }) => (
          <h5 className="font-heading font-semibold text-sm text-foreground mt-2 mb-1">
            {children}
          </h5>
        ),
        p: ({ children }) => (
          <p className="text-muted-foreground text-sm leading-relaxed mb-2 last:mb-0">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc ml-5 space-y-1 text-sm text-muted-foreground mb-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal ml-5 space-y-1 text-sm text-muted-foreground mb-2">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="my-2 overflow-x-auto rounded-lg border border-border-muted bg-surface-obsidian p-3">
                <code className="font-mono text-xs text-neon-blue">{children}</code>
              </pre>
            );
          }
          return (
            <code className="rounded bg-surface-obsidian px-1.5 py-0.5 font-mono text-xs text-neon-blue">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-neon-purple/40 pl-3 italic text-muted-foreground my-2">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-blue underline underline-offset-2 hover:text-neon-blue/80"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export { MarkdownContent };
