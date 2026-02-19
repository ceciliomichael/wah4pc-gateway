"use client";

interface FormInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	type?: "text" | "email" | "tel" | "date" | "datetime-local" | "number";
	error?: string;
	required?: boolean;
	placeholder?: string;
	disabled?: boolean;
	id?: string;
	maxLength?: number;
}

export function FormInput({
	label,
	value,
	onChange,
	type = "text",
	error,
	required = false,
	placeholder,
	disabled = false,
	id,
	maxLength,
}: FormInputProps) {
	const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

	return (
		<div className="w-full">
			<label
				htmlFor={inputId}
				className="block text-sm font-medium text-stone-900 mb-2"
			>
				{label}
				{required && <span className="text-amber-600 ml-1">*</span>}
			</label>
			<input
				id={inputId}
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				placeholder={placeholder}
				maxLength={maxLength}
				className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 
					placeholder:text-stone-400
					focus:border-stone-400 focus:outline-none transition-colors
					disabled:bg-stone-100 disabled:text-stone-500 disabled:cursor-not-allowed"
			/>
			{error && <p className="mt-1 text-sm text-tertiary-600">{error}</p>}
		</div>
	);
}