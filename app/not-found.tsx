export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">404 - Page Not Found</h2>
        <p className="mb-4">The page you are looking for does not exist.</p>
        <a href="/" className="text-blue-400 hover:text-blue-300 underline">
          Return Home
        </a>
      </div>
    </div>
  );
}