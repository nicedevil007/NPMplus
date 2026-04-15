import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import type { CrowdsecDecision } from "src/api/backend";
import { LoadingPage } from "src/components";
import { TableLayout } from "src/components/Table/TableLayout";
import { useCrowdsecDecisions, useLogsAvailability } from "src/hooks";
import { formatDateTime, intl, T } from "src/locale";
import { showLogsDetailModal } from "src/modals";
import LogsCard from "./LogsCard";

export default function Crowdsec() {
	const [search, setSearch] = useState("");
	const availability = useLogsAvailability();
	const { isLoading, isError, error, data } = useCrowdsecDecisions(false, {
		enabled: availability.data?.crowdsec === true,
	});

	const columnHelper = createColumnHelper<CrowdsecDecision>();
	const columns = useMemo(
		() => [
			columnHelper.accessor("createdAt", {
				header: intl.formatMessage({ id: "logs.column.time" }),
				cell: (info) => formatDateTime(info.getValue()),
				meta: { className: "text-nowrap" },
			}),
			columnHelper.accessor("type", {
				header: intl.formatMessage({ id: "logs.column.action" }),
				cell: (info) => <span className="badge bg-red-lt">{info.getValue()}</span>,
				meta: { className: "w-1" },
			}),
			columnHelper.accessor("value", { header: intl.formatMessage({ id: "logs.column.value" }) }),
			columnHelper.accessor("scope", {
				header: intl.formatMessage({ id: "logs.column.scope" }),
				meta: { className: "w-1" },
			}),
			columnHelper.accessor("scenario", { header: intl.formatMessage({ id: "logs.column.scenario" }) }),
			columnHelper.accessor("origin", {
				header: intl.formatMessage({ id: "logs.column.origin" }),
				meta: { className: "w-1" },
			}),
			columnHelper.accessor("duration", {
				header: intl.formatMessage({ id: "logs.column.duration" }),
				meta: { className: "w-1 text-nowrap" },
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
								"logs.crowdsec",
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

	const filtered = useMemo(() => {
		const rows = data ?? [];
		if (!search) return rows;
		const s = search.toLowerCase();
		return rows.filter((d) =>
			[d.value, d.scope, d.scenario, d.origin, d.type].some((v) => v?.toLowerCase().includes(s)),
		);
	}, [data, search]);

	const tableInstance = useReactTable<CrowdsecDecision>({
		columns,
		data: filtered,
		getCoreRowModel: getCoreRowModel(),
	});

	if (availability.isLoading) return <LoadingPage />;
	if (availability.data && !availability.data.crowdsec) {
		return (
			<Alert variant="info" className="mt-4">
				<T id="logs.crowdsec.unavailable" />
			</Alert>
		);
	}
	if (isLoading) return <LoadingPage />;
	if (isError) return <Alert variant="danger">{error?.message ?? "Unknown error"}</Alert>;

	return (
		<LogsCard titleId="logs.crowdsec" search={search} onSearchChange={setSearch} statusColor="bg-purple">
			<TableLayout tableInstance={tableInstance} />
		</LogsCard>
	);
}
