import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BannerProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
}

const Banner: React.FC<BannerProps> = ({ title, subtitle, breadcrumb }) => {
  return (
    <div className="bg-white dark:bg-gray-800 px-4 py-3 shadow-md rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
    {/* Title + Subtitle */}
    <div>
      {title && (
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{subtitle}</p>
      )}
    </div>

    {/* Breadcrumb */}
    {breadcrumb && breadcrumb.length > 0 && (
      <nav className="mt-3 md:mt-0" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumb.map((item, index) => (
            <li key={index} className="flex items-center space-x-2">
              {item.href ? (
                <a
                  href={item.href}
                  className="hover:underline text-gray-600 dark:text-gray-300"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {item.label}
                </span>
              )}
              {index < breadcrumb.length - 1 && (
                <span className="text-gray-400 dark:text-gray-500">/</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    )}
  </div>
</div>

  );
};

export default Banner;
