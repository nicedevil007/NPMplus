import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { T } from "src/locale";

interface Props {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
}

export default function LogsPagination({ page, pageSize, total, onPageChange }: Props) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const first = total === 0 ? 0 : page * pageSize + 1;
	const last = Math.min(total, (page + 1) * pageSize);

	// Local state so the user can type freely without every keystroke triggering a fetch
	const [jump, setJump] = useState(String(page + 1));
	useEffect(() => setJump(String(page + 1)), [page]);

	const commitJump = () => {
		const n = Number.parseInt(jump, 10);
		if (Number.isNaN(n)) return setJump(String(page + 1));
		const clamped = Math.min(Math.max(n, 1), totalPages);
		onPageChange(clamped - 1);
	};

	return (
		<div className="card-footer d-flex align-items-center">
			<p className="m-0 text-secondary">
				<T id="logs.pagination.range" data={{ first, last, total }} />
			</p>
			<ul className="pagination m-0 ms-auto align-items-center">
				<li className={`page-item ${page === 0 ? "disabled" : ""}`}>
					<button
						type="button"
						className="page-link"
						onClick={(e) => {
							e.currentTarget.blur();
							onPageChange(Math.max(0, page - 1));
						}}
						disabled={page === 0}
					>
						<IconChevronLeft size={16} />
						<T id="logs.pagination.prev" />
					</button>
				</li>
				<li className="page-item d-flex align-items-center gap-2 px-2">
					<input
						type="number"
						className="form-control form-control-sm text-center"
						style={{ width: 64 }}
						min={1}
						max={totalPages}
						value={jump}
						onChange={(e) => setJump(e.target.value)}
						onBlur={commitJump}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								commitJump();
							}
						}}
					/>
					<span className="text-secondary small">/ {totalPages}</span>
				</li>
				<li className={`page-item ${page + 1 >= totalPages ? "disabled" : ""}`}>
					<button
						type="button"
						className="page-link"
						onClick={(e) => {
							e.currentTarget.blur();
							onPageChange(page + 1);
						}}
						disabled={page + 1 >= totalPages}
					>
						<T id="logs.pagination.next" />
						<IconChevronRight size={16} />
					</button>
				</li>
			</ul>
		</div>
	);
}
