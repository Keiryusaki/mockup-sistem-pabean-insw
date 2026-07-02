import { Card, CardHeader, Text, Skeleton, SkeletonGroup, Button } from "@lnsw-ui/react";
import { useEffect, useState } from "react";

export function LoadingPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Text as="h1" size="lg" weight="bold">Loading State (Skeleton)</Text>
        <Button variant="outline" size="sm" onClick={() => setLoading(true)}>Reload demo</Button>
      </div>

      <Card>
        <CardHeader>
          <Text weight="semibold">Profil Perusahaan</Text>
        </CardHeader>
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton circle height={56} />
            <div className="flex-1">
              <SkeletonGroup count={3} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-primary-100" />
            <div>
              <Text weight="semibold">PT Maju Jaya</Text>
              <Text size="sm" muted>NPWP 01.234.567.8-901.000 · Importir Terdaftar</Text>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <Text size="sm" muted className="mb-3">Contoh pemakaian persis seperti di Storybook:</Text>
        <pre className="overflow-x-auto rounded-md bg-neutral-800 p-4 text-xs text-neutral-50">
{`import { Skeleton, SkeletonGroup } from "@lnsw-ui/react";

<Skeleton circle height={56} />
<SkeletonGroup count={3} />`}
        </pre>
      </Card>
    </div>
  );
}
