import { useState, useEffect } from "react";

interface TerminologyOption {
	code: string;
	display: string;
}

interface PSGCResponse {
	level: string;
	parent: string | null;
	count: number;
	data: TerminologyOption[];
}

interface CodeSystemResponse {
	name: string;
	count: number;
	data: TerminologyOption[];
}

export function usePSGC(level: string, parentCode?: string) {
	const [data, setData] = useState<TerminologyOption[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!level) {
			setData([]);
			return;
		}

		const fetchData = async () => {
			setLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams({ level });
				if (parentCode) {
					params.append("parent", parentCode);
				}

				const response = await fetch(`/api/terminology/psgc?${params}`);

				if (!response.ok) {
					throw new Error(`Failed to fetch ${level} data`);
				}

				const result: PSGCResponse = await response.json();
				setData(result.data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
				setData([]);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [level, parentCode]);

	return { data, loading, error };
}

export function useCodeSystem(name: string) {
	const [data, setData] = useState<TerminologyOption[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!name) {
			setData([]);
			return;
		}

		const fetchData = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch(`/api/terminology/codesystem/${name}`);

				if (!response.ok) {
					throw new Error(`Failed to fetch ${name} data`);
				}

				const result: CodeSystemResponse = await response.json();
				setData(result.data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
				setData([]);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [name]);

	return { data, loading, error };
}