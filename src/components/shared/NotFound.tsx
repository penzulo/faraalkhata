import { Link } from "@tanstack/react-router";

export function NotFound() {
	return (
		<div className="flex h-screen flex-col items-center justify-center text-center">
			<h1 className="font-bold text-4xl">404 - Page Not Found</h1>
			<p className="mt-4">Oops! The page you're looking for doesn't exist.</p>
			<Link
				to="/"
				className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
			>
				Go Back Home
			</Link>
		</div>
	);
}
