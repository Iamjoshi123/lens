import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-lens-bg text-lens-text">
            <h2 className="text-4xl font-bold mb-4 text-lens-primary">Not Found</h2>
            <p className="text-lens-muted mb-6">Could not find requested resource</p>
            <Link
                href="/"
                className="px-6 py-2 bg-lens-primary text-lens-secondary rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
                Return Home
            </Link>
        </div>
    )
}
