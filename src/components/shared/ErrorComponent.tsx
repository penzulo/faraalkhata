import { type ErrorComponentProps, Link } from "@tanstack/react-router";

export function ErrorComponent({ error }: ErrorComponentProps) {
	// You can log the error to a service like Sentry here
	console.error(error);

	return (
		<div className="flex h-screen flex-col items-center justify-center text-center text-red-700">
			<h1 className="font-bold text-4xl">Something Went Wrong</h1>
			<pre className="mt-4 rounded-md bg-red-50 p-2 text-sm">
				{error.message}
			</pre>
			<Link
				to="/"
				className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
				// This will reset the router's error state
				onClick={(e) => {
					e.preventDefault();
					window.location.href = "/";
				}}
			>
				Go Back Home
			</Link>
		</div>
	);
}
