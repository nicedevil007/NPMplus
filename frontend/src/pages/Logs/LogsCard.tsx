import { IconSearch, IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { intl, T } from "src/locale";

interface Props {
	titleId: string;
	search?: string;
	onSearchChange?: (value: string) => void;
	hideSearch?: boolean;
	from?: string;
	to?: string;
	onFromChange?: (value: string) => void;
	onToChange?: (value: string) => void;
	children: ReactNode;
	footer?: ReactNode;
	statusColor?: string;
}

export default function LogsCard({
	titleId,
	search,
	onSearchChange,
	hideSearch,
	from,
	to,
	onFromChange,
	onToChange,
	children,
	footer,
	statusColor = "bg-primary",
}: Props) {
	const showDateFilter = Boolean(onFromChange && onToChange);
	const hasDateFilter = Boolean(from || to);
	return (
		<div className="card mt-4">
			<div className={`card-status-top ${statusColor}`} />
			<div className="card-table">
				<div className="card-header">
					<div className="row w-full">
						<div className="col">
							<h2 className="mt-1 mb-0">
								<T id={titleId} />
							</h2>
						</div>
						{!hideSearch || showDateFilter ? (
							<div className="col-md-auto col-sm-12">
								<div className="ms-auto d-flex flex-wrap align-items-center gap-2">
									{showDateFilter ? (
										<>
											<input
												type="datetime-local"
												className="form-control form-control-sm"
												style={{ width: "auto" }}
												title={intl.formatMessage({ id: "logs.filter.from" })}
												value={from ?? ""}
												onChange={(e) => onFromChange?.(e.target.value)}
											/>
											<span className="text-secondary">–</span>
											<input
												type="datetime-local"
												className="form-control form-control-sm"
												style={{ width: "auto" }}
												title={intl.formatMessage({ id: "logs.filter.to" })}
												value={to ?? ""}
												onChange={(e) => onToChange?.(e.target.value)}
											/>
											{hasDateFilter ? (
												<button
													type="button"
													className="btn btn-icon btn-sm"
													title={intl.formatMessage({ id: "logs.filter.clear" })}
													onClick={() => {
														onFromChange?.("");
														onToChange?.("");
													}}
												>
													<IconX size={16} />
												</button>
											) : null}
										</>
									) : null}
									{!hideSearch ? (
										<div className="input-group input-group-flat w-auto">
											<span className="input-group-text input-group-text-sm">
												<IconSearch size={16} />
											</span>
											<input
												type="text"
												className="form-control form-control-sm"
												autoComplete="off"
												value={search ?? ""}
												onChange={(e) => onSearchChange?.(e.target.value)}
											/>
										</div>
									) : null}
								</div>
							</div>
						) : null}
					</div>
				</div>
				{children}
			</div>
			{footer}
		</div>
	);
}
