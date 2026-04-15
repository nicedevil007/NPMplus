import { IconCheck, IconCopy } from "@tabler/icons-react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import EasyModal, { type InnerModalProps } from "ez-modal-react";
import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Button } from "src/components";
import { intl, T } from "src/locale";

async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		// fall through to legacy path (Permissions-Policy may block clipboard API)
	}
	try {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.style.position = "fixed";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.focus();
		ta.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(ta);
		return ok;
	} catch {
		return false;
	}
}

type Entry = Record<string, unknown>;

interface Props extends InnerModalProps {
	entry: Entry;
	titleId: string;
	jsonField?: string; // when set, that field's value is shown instead of the whole entry (e.g. "rawJson" for WAF)
}

const showLogsDetailModal = (entry: Entry, titleId: string, jsonField?: string) => {
	EasyModal.show(LogsDetailModal, { entry, titleId, jsonField });
};

const LogsDetailModal = EasyModal.create(({ entry, titleId, jsonField, visible, remove }: Props) => {
	const target = jsonField && entry[jsonField] && typeof entry[jsonField] === "object"
		? (entry[jsonField] as Record<string, unknown>)
		: entry;
	const json = JSON.stringify(target, null, 2);
	const [copied, setCopied] = useState(false);

	const onCopy = async () => {
		if (await copyToClipboard(json)) {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	};

	return (
		<Modal show={visible} onHide={remove} size="lg">
			<Modal.Header closeButton>
				<Modal.Title>
					<T id={titleId} />
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<div style={{ position: "relative" }}>
					<button
						type="button"
						className="btn btn-icon"
						style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
						title={intl.formatMessage({ id: copied ? "logs.action.copied" : "logs.action.copy" })}
						onClick={onCopy}
					>
						{copied ? <IconCheck size={18} stroke={2.5} /> : <IconCopy size={18} stroke={2} />}
					</button>
					<CodeEditor
						language="json"
						padding={15}
						data-color-mode="dark"
						minHeight={300}
						indentWidth={2}
						style={{
							fontFamily:
								"ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
							borderRadius: "0.3rem",
							minHeight: "300px",
							backgroundColor: "var(--tblr-bg-surface-dark)",
						}}
						readOnly
						value={json}
					/>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button data-bs-dismiss="modal" onClick={remove}>
					<T id="action.close" />
				</Button>
			</Modal.Footer>
		</Modal>
	);
});

export { showLogsDetailModal };
