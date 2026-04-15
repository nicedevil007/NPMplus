import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import type { AccessLogEntry } from "src/api/backend";
import { LoadingPage } from "src/components";
import { TableLayout } from "src/components/Table/TableLayout";
import { useAccessLogs, useDebouncedValue, useLogsLiveStream } from "src/hooks";
import { formatDateTime, intl, T } from "src/locale";
import { showLogsDetailModal } from "src/modals";
import { localToIso } from "./dateRange";
import LogsCard from "./LogsCard";
import LogsPagination from "./LogsPagination";

const PAGE_SIZE = 50;

const STATUS_BADGE = (status: number): string => {
	if (status >= 500) return "bg-red-lt";
	if (status >= 400) return "bg-orange-lt";
	if (status >= 300) return "bg-yellow-lt";
	if (status >= 200) return "bg-green-lt";
	return "bg-secondary-lt";
};

function formatBytes(bytes: number): string {
	if (!bytes) return "0";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AccessLogs() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [page, setPage] = useState(0);
	const debouncedSearch = useDebouncedValue(search);

	// Reset to first page when search changes
	const effectivePage = debouncedSearch !== search ? 0 : page;

	const { isLoading, isError, error, data, refetch } = useAccessLogs({
		limit: PAGE_SIZE,
		offset: effectivePage * PAGE_SIZE,
		search: debouncedSearch || undefined,
		from: localToIso(from),
		to: localToIso(to),
	});

	useLogsLiveStream({ access: () => refetch() });

	const columnHelper = createColumnHelper<AccessLogEntry>();
	const columns = useMemo(
		() => [
			columnHelper.accessor("time", {
				header: intl.formatMessage({ id: "logs.column.time" }),
				cell: (info) => formatDateTime(info.getValue()),
				meta: { className: "text-nowrap" },
			}),
			columnHelper.accessor("status", {
				header: intl.formatMessage({ id: "logs.column.status" }),
				cell: (info) => (
					<span className={`badge ${STATUS_BADGE(info.getValue())}`}>{info.getValue()}</span>
				),
				meta: { className: "w-1" },
			}),
			columnHelper.accessor("method", {
				header: intl.formatMessage({ id: "logs.column.method" }),
				meta: { className: "w-1" },
			}),
			columnHelper.accessor("host", { header: intl.formatMessage({ id: "logs.column.host" }) }),
			columnHelper.accessor("path", {
				header: intl.formatMessage({ id: "logs.column.path" }),
				cell: (info) => (
					<span className="text-truncate d-inline-block" style={{ maxWidth: 400 }}>
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor("clientIp", { header: intl.formatMessage({ id: "logs.column.client-ip" }) }),
			columnHelper.accessor("totalBytes", {
				header: intl.formatMessage({ id: "logs.column.bytes" }),
				cell: (info) => formatBytes(info.getValue()),
				meta: { className: "text-end" },
			}),
			columnHelper.display({
				id: "actions",
				cell: (info) => (
					<button
						type="button"
						className="btn btn-action btn-sm px-1"
						onClick={(e) => {
							e.preventDefault();
							showLogsDetailModal(
								info.row.original as unknown as Record<string, unknown>,
								"logs.access",
							);
						}}
					>
						<T id="action.view-details" />
					</button>
				),
				meta: { className: "text-end w-1" },
			}),
		],
		[columnHelper],
	);

	const tableInstance = useReactTable<AccessLogEntry>({
		columns,
		data: data?.entries ?? [],
		getCoreRowModel: getCoreRowModel(),
	});

	if (isLoading && !data) return <LoadingPage />;
	if (isError) return <Alert variant="danger">{error?.message ?? "Unknown error"}</Alert>;

	return (
		<LogsCard
			titleId="logs.access"
			search={search}
			onSearchChange={(v) => {
				setSearch(v);
				setPage(0);
			}}
			from={from}
			to={to}
			onFromChange={(v) => {
				setFrom(v);
				setPage(0);
			}}
			onToChange={(v) => {
				setTo(v);
				setPage(0);
			}}
			statusColor="bg-blue"
			footer={
				<LogsPagination
					page={effectivePage}
					pageSize={PAGE_SIZE}
					total={data?.total ?? 0}
					onPageChange={setPage}
				/>
			}
		>
			<TableLayout tableInstance={tableInstance} />
		</LogsCard>
	);
}
