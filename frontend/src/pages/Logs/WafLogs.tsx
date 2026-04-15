import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import type { WafEvent } from "src/api/backend";
import { LoadingPage } from "src/components";
import { TableLayout } from "src/components/Table/TableLayout";
import { useDebouncedValue, useLogsLiveStream, useWafLogs } from "src/hooks";
import { formatDateTime, intl, T } from "src/locale";
import { showLogsDetailModal } from "src/modals";
import { localToIso } from "./dateRange";
import LogsCard from "./LogsCard";
import LogsPagination from "./LogsPagination";

const PAGE_SIZE = 50;

const SEVERITY_BADGE: Record<string, string> = {
	critical: "bg-red",
	high: "bg-red-lt",
	medium: "bg-orange-lt",
	low: "bg-yellow-lt",
	info: "bg-secondary-lt",
};

export default function WafLogs() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [page, setPage] = useState(0);
	const debouncedSearch = useDebouncedValue(search);
	const effectivePage = debouncedSearch !== search ? 0 : page;

	const { isLoading, isError, error, data, refetch } = useWafLogs({
		limit: PAGE_SIZE,
		offset: effectivePage * PAGE_SIZE,
		search: debouncedSearch || undefined,
		from: localToIso(from),
		to: localToIso(to),
	});

	useLogsLiveStream({ waf: () => refetch() });

	const columnHelper = createColumnHelper<WafEvent>();
	const columns = useMemo(
		() => [
			columnHelper.accessor("eventTime", {
				header: intl.formatMessage({ id: "logs.column.time" }),
				cell: (info) => formatDateTime(info.getValue()),
				meta: { className: "text-nowrap" },
			}),
			columnHelper.accessor("eventSeverity", {
				header: intl.formatMessage({ id: "logs.column.severity" }),
				cell: (info) => (
					<span
						className={`badge ${SEVERITY_BADGE[info.getValue().toLowerCase()] ?? "bg-secondary-lt"}`}
					>
						{info.getValue()}
					</span>
				),
				meta: { className: "w-1" },
			}),
			columnHelper.accessor("waapIncidentType", {
				header: intl.formatMessage({ id: "logs.column.incident-type" }),
			}),
			columnHelper.accessor("httpHostName", { header: intl.formatMessage({ id: "logs.column.host" }) }),
			columnHelper.accessor("matchedParameter", {
				header: intl.formatMessage({ id: "logs.column.matched" }),
				cell: (info) => (
					<span>
						<code>{info.getValue() || "-"}</code>{" "}
						<small className="text-secondary">{info.row.original.matchedLocation}</small>
					</span>
				),
			}),
			columnHelper.accessor("sourceIp", { header: intl.formatMessage({ id: "logs.column.client-ip" }) }),
			columnHelper.accessor("securityAction", {
				header: intl.formatMessage({ id: "logs.column.action" }),
				cell: (info) => <span className="badge bg-azure-lt">{info.getValue()}</span>,
				meta: { className: "w-1" },
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
								"logs.waf",
								"rawJson",
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

	const tableInstance = useReactTable<WafEvent>({
		columns,
		data: data?.entries ?? [],
		getCoreRowModel: getCoreRowModel(),
	});

	if (isLoading && !data) return <LoadingPage />;
	if (isError) return <Alert variant="danger">{error?.message ?? "Unknown error"}</Alert>;

	return (
		<LogsCard
			titleId="logs.waf"
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
			statusColor="bg-red"
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
