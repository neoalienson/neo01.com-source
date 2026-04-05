import React from 'react';

export function ToolLayout({ title, children, className = '' }) {
  return (
    <div className={`tool-wrapper ${className}`}>
      <article className="article article-single article-type-tools" itemScope itemType="https://schema.org/TechArticle">
        <div className="article-inner">
          <h1 className="article-title" itemProp="name">{title}</h1>
          <div className="article-entry" itemProp="articleBody">
            {children}
          </div>
        </div>
      </article>
    </div>
  );
}