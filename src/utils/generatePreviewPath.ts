// In the Name of God, the Creative, the Originator

const collectionPrefixMap: Record<string, string> = {
  pages: '',
  // Add more collections as needed
};

const globalPrefixMap: Record<string, string> = {
  'static-pages': '/about',
};

type CollectionPreviewProps = {
  collection: string;
  slug: string;
  req?: unknown;
};

type GlobalPreviewProps = {
  global: string;
  req?: unknown;
};

export const generateCollectionPreviewPath = ({
  collection,
  slug,
}: CollectionPreviewProps): string | null => {
  // Allow empty strings, e.g. for the homepage
  if (slug === undefined || slug === null) {
    return null;
  }

  // Encode to support slugs with special characters
  const encodedSlug = encodeURIComponent(slug);

  const encodedParams = new URLSearchParams({
    slug: encodedSlug,
    collection,
    path: `${collectionPrefixMap[collection] ?? ''}/${encodedSlug}`,
    previewSecret: process.env.PREVIEW_SECRET || '',
  });

  return `/api/preview?${encodedParams.toString()}`;
};

export const generateGlobalPreviewPath = ({ global }: GlobalPreviewProps): string | null => {
  const path = globalPrefixMap[global];

  if (path === undefined) {
    return null;
  }

  const encodedParams = new URLSearchParams({
    global,
    path: path || '/',
    previewSecret: process.env.PREVIEW_SECRET || '',
  });

  return `/api/preview?${encodedParams.toString()}`;
};
