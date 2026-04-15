import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import type { ErrorLogEntry } from "src/api/backend";
import { LoadingPage } from "src/components";
import { TableLayout } from "src/components/Table/TableLayout";
import { useDebouncedValue, useErrorLogs, useLogsLiveStream } from "src/hooks";
import { formatDateTime, intl, T } from "src/locale";
import { showLogsDetailModal } from "src/modals";
import { localToIso } from "./dateRange";
import LogsCard from "./LogsCard";
import LogsPagination from "./LogsPagination";

const PAGE_SIZE = 50;

const LEVEL_BADGE: Record<string, string> = {
	emerg: "bg-red",
	alert: "bg-red",
	crit: "bg-red-lt",
	error: "bg-orange-lt",
	warn: "bg-yellow-lt",
	notice: "bg-blue-lt",
	info: "bg-azure-lt",
	debug: "bg-secondary-lt",
};

export default function ErrorLogs() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [page, setPage] = useState(0);
	const debouncedSearch = useDebouncedValue(search);
	const effectivePage = debouncedSearch !== search ? 0 : page;

	const { isLoading, isError, error, data, refetch } = useErrorLogs({
		limit: PAGE_SIZE,
		offset: effectivePage * PAGE_SIZE,
		search: debouncedSearch || undefined,
		from: localToIso(from),
		to: localToIso(to),
	});

	useLogsLiveStream({ error: () => refetch() });

	const columnHelper = createColumnHelper<ErrorLogEntry>();
	const columns = useMemo(
		() => [
			columnHelper.accessor("time", {
				header: intl.formatMessage({ id: "logs.column.time" }),
				cell: (info) => formatDateTime(info.getValue()),
				meta: { className: "text-nowrap" },
			}),
			columnHelper.accessor("level", {
				header: intl.formatMessage({ id: "logs.column.level" }),
				cell: (info) => (
					<span
						className={`badge ${LEVEL_BADGE[info.getValue().toLowerCase()] ?? "bg-secondary-lt"}`}
					>
						{info.getValue()}
					</span>
				),
				meta: { className: "w-1" },
			}),
			columnHelper.accessor("server", { header: intl.formatMessage({ id: "logs.column.server" }) }),
			columnHelper.accessor("clientIp", { header: intl.formatMessage({ id: "logs.column.client-ip" }) }),
			columnHelper.accessor("message", {
				header: intl.formatMessage({ id: "logs.column.message" }),
				cell: (info) => <span className="text-break">{info.getValue()}</span>,
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
								"logs.errors",
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

	const tableInstance = useReactTable<ErrorLogEntry>({
		columns,
		data: data?.entries ?? [],
		getCoreRowModel: getCoreRowModel(),
	});

	if (isLoading && !data) return <LoadingPage />;
	if (isError) return <Alert variant="danger">{error?.message ?? "Unknown error"}</Alert>;

	return (
		<LogsCard
			titleId="logs.errors"
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
			statusColor="bg-orange"
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
