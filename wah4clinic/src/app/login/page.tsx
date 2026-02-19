"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LucideLoaderCircle, LucideLock, LucideShieldAlert } from "lucide-react";
import { useAuth } from "@/stores/auth-store";

export default function LoginPage() {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { isAuthenticated, isLoading, loginWithPassword } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.push("/");
		}
	}, [isAuthenticated, isLoading, router]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");

		if (!password.trim()) {
			setError("Password is required.");
			return;
		}

		setIsSubmitting(true);
		const result = await loginWithPassword(password.trim());
		if (result.success) {
			router.push("/");
		} else {
			setError(result.error || "Login failed.");
		}
		setIsSubmitting(false);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
				<div className="flex items-center gap-2 text-stone-700">
					<LucideLoaderCircle className="w-5 h-5 animate-spin text-primary-700" />
					<span>Checking session...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-8 md:px-6 lg:px-8">
			<div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-sm">
				<div className="mb-6">
					<div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
						<LucideLock className="h-5 w-5" />
					</div>
					<h1 className="mt-4 text-2xl font-semibold text-stone-900">Clinic Login</h1>
					<p className="mt-1 text-sm text-stone-600">Enter clinic password to continue.</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="password" className="mb-2 block text-sm font-medium text-stone-800">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(event) => {
								setPassword(event.target.value);
								if (error) setError("");
							}}
							placeholder="Enter password"
							className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500"
							autoFocus
							required
						/>
					</div>

					{error && (
						<div className="flex items-center gap-2 rounded-xl border border-tertiary-200 bg-tertiary-50 px-3 py-2 text-sm text-tertiary-700">
							<LucideShieldAlert className="h-4 w-4" />
							<span>{error}</span>
						</div>
					)}

					<button
						type="submit"
						disabled={isSubmitting}
						className="min-h-11 w-full rounded-xl bg-primary-700 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isSubmitting ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}
