"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { LucideLoader2 } from "lucide-react";

interface Option {
	code: string;
	display: string;
}

interface FormSelectProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: Option[];
	loading?: boolean;
	error?: string;
	required?: boolean;
	placeholder?: string;
	disabled?: boolean;
	id?: string;
}

export function FormSelect({
	label,
	value,
	onChange,
	options,
	loading = false,
	error,
	required = false,
	placeholder = "Select an option",
	disabled = false,
	id,
}: FormSelectProps) {
	const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	const selectedOption = options.find((o) => o.code === value);
	const displayText = selectedOption?.display || "";

	const filteredOptions = search
		? options.filter((o) => o.display.toLowerCase().includes(search.toLowerCase()))
		: options;

	const handleToggle = useCallback(() => {
		if (disabled || loading) return;
		setIsOpen((prev) => {
			if (!prev) {
				setSearch("");
			}
			return !prev;
		});
	}, [disabled, loading]);

	const handleSelect = useCallback((code: string) => {
		onChange(code);
		setIsOpen(false);
		setSearch("");
	}, [onChange]);

	useEffect(() => {
		if (isOpen && searchRef.current) {
			searchRef.current.focus();
		}
	}, [isOpen]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
				setSearch("");
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsOpen(false);
				setSearch("");
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	return (
		<div className="w-full" ref={containerRef}>
			<label
				htmlFor={selectId}
				className="block text-sm font-medium text-stone-900 mb-2"
			>
				{label}
				{required && <span className="text-amber-600 ml-1">*</span>}
			</label>
			<div className="relative">
				<button
					id={selectId}
					type="button"
					onClick={handleToggle}
					disabled={disabled || loading}
					className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white text-left
						focus:border-stone-400 focus:outline-none transition-colors
						disabled:bg-stone-100 disabled:text-stone-500 disabled:cursor-not-allowed
						pr-10 flex items-center"
				>
					<span className={`block truncate ${value ? "text-stone-900" : "text-stone-400"}`}>
						{displayText || placeholder}
					</span>
				</button>

				{loading && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						<LucideLoader2 className="w-5 h-5 text-stone-400 animate-spin" />
					</div>
				)}
				{!loading && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
						<svg
							className={`w-5 h-5 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				)}

				{isOpen && (
					<div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
						{options.length > 6 && (
							<div className="p-2 border-b border-stone-100">
								<input
									ref={searchRef}
									type="text"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search..."
									className="w-full h-9 px-3 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-900
										focus:border-stone-400 focus:outline-none transition-colors"
								/>
							</div>
						)}
						<div className="max-h-60 overflow-y-auto">
							<button
								type="button"
								onClick={() => handleSelect("")}
								className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-stone-50
									${!value ? "bg-stone-50 text-stone-900 font-medium" : "text-stone-400"}`}
							>
								{placeholder}
							</button>
							{filteredOptions.map((option) => (
								<button
									type="button"
									key={option.code}
									onClick={() => handleSelect(option.code)}
									className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-stone-50 break-words
										${option.code === value ? "bg-stone-100 text-stone-900 font-medium" : "text-stone-700"}`}
								>
									{option.display}
								</button>
							))}
							{filteredOptions.length === 0 && search && (
								<div className="px-4 py-3 text-sm text-stone-400">
									No results found
								</div>
							)}
						</div>
					</div>
				)}
			</div>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
}