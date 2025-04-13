export default function ErrorPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  return (
    <div>
      <h1>Verification Error</h1>
      <p>{searchParams.message || 'Unknown error occurred'}</p>
    </div>
  );
}
