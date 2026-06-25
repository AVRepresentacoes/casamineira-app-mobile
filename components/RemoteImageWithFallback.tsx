import { memo, useEffect, useState } from "react";
import { Image, ImageProps, ImageSourcePropType } from "react-native";

const DEFAULT_FALLBACK_URI =
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80";

type Props = Omit<ImageProps, "source"> & {
  uri?: ImageSourcePropType | string | null;
  fallbackUri?: string | null;
};

function RemoteImageWithFallbackComponent({ uri, fallbackUri, onError, ...props }: Props) {
  const isLocalSource = Boolean(uri && typeof uri !== "string");
  const remoteUri = typeof uri === "string" ? uri : "";
  const safeFallbackUri = fallbackUri?.trim() || DEFAULT_FALLBACK_URI;
  const primaryUri = remoteUri.trim() || safeFallbackUri;
  const [currentUri, setCurrentUri] = useState(primaryUri);

  useEffect(() => {
    setCurrentUri(primaryUri);
  }, [primaryUri]);

  if (isLocalSource) {
    return <Image {...props} source={uri as ImageSourcePropType} onError={onError} />;
  }

  return (
    <Image
      {...props}
      source={{ uri: currentUri }}
      onError={(event) => {
        if (safeFallbackUri && currentUri !== safeFallbackUri) {
          setCurrentUri(safeFallbackUri);
        }
        onError?.(event);
      }}
    />
  );
}

export const RemoteImageWithFallback = memo(RemoteImageWithFallbackComponent);
