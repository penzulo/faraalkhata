import type { FieldApi } from "@tanstack/react-form";
import { useId } from "react";

interface FormFieldProps {
	field: FieldApi;
	label: string;
	type?: string;
	placeholder?: string;
	required?: boolean;
	className?: string;
}

export function FormField({
	field,
	label,
	type = "text",
	placeholder,
	required = false,
	className = "",
}: FormFieldProps) {
	const fieldId = useId();
	return (
		<div>
			<label htmlFor={field.name} className="sr-only">
				{label}
			</label>
			<input
				id={fieldId}
				name={field.name}
				type={type}
				required={required}
				className={`relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm ${className}`}
				placeholder={placeholder}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
			/>
			{field.state.meta.touchedErrors && (
				<p className="mt-1 text-red-600 text-sm">
					{field.state.meta.touchedErrors}
				</p>
			)}
		</div>
	);
}
